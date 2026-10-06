---
title: File Storage
description: The core's own file storage – saveFile, listFiles, deleteFile, the /api/files endpoints, the FileUploader component and the fileRepository
---

:::note
This page describes the core's own file storage, which the built-in apps use (avatars, desktop backgrounds). Plugins do not use it directly: they store files through `context.files`, see [Plugin file storage](/en/plugins-files/).
:::

## Overview

File contents are written to disk under the `uploads/` folder, the metadata goes to the `platform.files` table. The code is split into two places:

| Location | Contents |
|---|---|
| `src/lib/storage/` | Remote functions callable from the browser: `saveFile`, `listFiles`, `deleteFile`, `deleteBackground` |
| `src/lib/server/storage/` | Server-only code: `filesystem.ts`, `file-repository.ts`, `types.ts`, `schemas.ts`, plus server copies of the remote functions and `getFileMetadata` |

Every remote function requires a logged-in user. Without one they return `{ success: false, error: 'User not authenticated' }`. Errors are returned in the result, not thrown.

## Categories and scopes

Every file has a **category** and a **scope**.

- **Category**: a lowercase name that matches `^[a-z0-9-]+$` (max. 100 characters), for example `avatars` or `backgrounds`. `STORAGE_CONFIG.allowedCategories` lists the categories used by the core: `backgrounds`, `documents`, `avatars`, `images`. Only `/api/files/list` enforces this list; `saveFile` accepts any name that matches the pattern.
- **Scope**: `'shared'` or `'user'`. Shared files can be read by every logged-in user. User files belong to the uploader and are stored in a `user-{userId}` folder.

## Storage layout

The `uploads/` folder is resolved from the working directory of the process (`getUploadsPath()` returns `path.join(process.cwd(), 'uploads')`).

```
uploads/
├── avatars/
│   └── user-42/
│       ├── photo.jpg
│       └── thumb-photo.jpg
├── backgrounds/
│   ├── shared/
│   │   ├── image/
│   │   └── video/
│   └── user-42/
└── plugin-files/        # plugin storage, never served by /api/files
```

`saveFile` always writes to `uploads/{category}/{shared | user-{userId}}/{filename}`. It does not create deeper folders; subfolders such as `backgrounds/shared/image/` only exist if files are placed there by other means.

File names are sanitized before saving: the name part keeps only `a-z A-Z 0-9 - _`, the extension keeps only letters and digits, and the total length is capped at 255 characters. If a file with that name already exists, an 8-character random suffix is added (`photo-1a2b3c4d.jpg`).

## Remote functions

```typescript
import { saveFile } from '$lib/storage/save-file.remote.js';
import { listFiles } from '$lib/storage/list-files.remote.js';
import { deleteFile } from '$lib/storage/delete-file.remote.js';
```

All of them return a `StoredFile` (or a list of them) on success:

```typescript
interface StoredFile {
  id: string;            // publicId (UUID)
  filename: string;      // stored (sanitized, maybe suffixed) name
  originalName: string;  // name sent by the client
  category: string;
  scope: 'shared' | 'user';
  userId: number | null; // null for shared files
  mimeType: string;
  size: number;          // bytes, after image processing
  storagePath: string;   // relative to uploads/, e.g. avatars/user-42/photo.jpg
  url: string;           // /api/files/{category}/{shared|user-{id}}/{filename}
  thumbnailUrl?: string; // /api/files/{thumbnailPath}
  createdAt: Date;
}
```

### saveFile

```typescript
const result = await saveFile({
  fileData: dataUrl,          // base64, a "data:...;base64," prefix is allowed
  fileName: 'photo.jpg',      // 1–255 characters
  mimeType: 'image/jpeg',     // declared type, see MIME detection below
  category: 'avatars',
  scope: 'user',
  options: {
    generateThumbnail: true,  // required
    maxImageWidth: 1920,      // optional, >= 1
    maxImageHeight: 1080      // optional, >= 1
  }
});

if (result.success) {
  console.log(result.file.id, result.file.url);
} else {
  console.error(result.error);
}
```

Returns `{ success: boolean; file?: StoredFile; error?: string }`.

Steps on the server:

1. Decodes the base64 data and checks the MIME type from the content (see below).
2. For images, resizes proportionally to `maxImageWidth` / `maxImageHeight` (if given) with `sharp`. If `generateThumbnail` is `true`, it also saves a thumbnail (max. 200×200 px) as `thumb-{fileName}` in the same folder.
3. Writes the file to disk and inserts a row into `platform.files` with a new UUID as `publicId`. For `scope: 'user'` the `userId` is the current user, for `'shared'` it is `null`.

### MIME detection

The server does not trust the declared `mimeType`. It detects the type from the file content with the `file-type` package and accepts only these types (the server always uses this list, regardless of the uploader's `fileType` prop):

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, `image/bmp`
- Documents: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), ODT, `text/plain`, `text/csv`

Plain text and CSV cannot be detected from content, so for those the declared `mimeType` is accepted if it is `text/plain` or `text/csv`. Any other undetectable file fails with `Unable to detect file type`. The detected type is the one stored in the database.

### listFiles

```typescript
const result = await listFiles({ category: 'avatars', scope: 'user' });
// { success: boolean; files: StoredFile[]; error?: string }
```

Reads from the database. With `scope: 'user'` it returns only the current user's files in the category, with `scope: 'shared'` every shared file in the category. There is no pagination or sorting.

### deleteFile

```typescript
const result = await deleteFile({ fileId: file.id });
// { success: boolean; error?: string }
```

Deletes the file and its thumbnail from disk and then the database row. If the file is already missing from disk, it still deletes the row. A user can only delete files whose `userId` is their own. Shared files are saved with `userId: null`, so in the current code `deleteFile` refuses to delete them.

### deleteBackground

`deleteBackground({ filename })` from `$lib/storage/delete-background.remote.js` deletes `backgrounds/user-{userId}/{filename}` and its `thumb-` file from disk. It does not touch the database.

### getFileMetadata

`getFileMetadata({ fileId })` exists only in `$lib/server/storage/` (it is exported from its `index.ts`). It returns `{ success, file?, error? }`. Shared files are visible to every logged-in user, user files only to their owner.

## Serving files: `GET /api/files/...`

```
GET /api/files/{category}/{shared | user-{id}}/{filename}
```

The `url` and `thumbnailUrl` fields of `StoredFile` point here. Rules:

| Check | Result |
|---|---|
| No valid session | `401` |
| First path segment is `plugin-files` | `404` (plugin files are only served through the plugin's signed links) |
| Fewer than 3 segments, or the second is not `shared` / `user-{number}` | `400` |
| Path contains `..`, a null byte, or is absolute | `400` |
| `user-{id}` folder of another user | `403`, except in the `avatars` category, where any logged-in user can read it |
| File does not exist | `404` |

Shared files can be read by any logged-in user. Extra path segments after the scope are allowed (for example `/api/files/backgrounds/shared/image/sunset.jpg`). The category is not checked against `allowedCategories`.

On success the response has:

- `Content-Type` based on the file extension (not the database record), `application/octet-stream` for unknown extensions
- `Cache-Control: public, max-age=3600`
- `X-Content-Type-Options: nosniff`

Errors are returned as JSON: `{ "error": "..." }`.

## Listing a folder: `GET /api/files/list`

```
GET /api/files/list?category=backgrounds&scope=shared&type=image
```

| Parameter | Required | Description |
|---|---|---|
| `category` | Yes | Must be one of `allowedCategories` (`backgrounds`, `documents`, `avatars`, `images`), otherwise `400 Invalid category` |
| `scope` | Yes | `shared` or `user`, otherwise `400 Invalid scope` |
| `type` | No | Subfolder name (`^[a-z0-9-]+$`), only used with `scope=shared` |

The folder that is read:

- `scope=shared`: `uploads/{category}/shared/` or `uploads/{category}/shared/{type}/`
- `scope=user`: `uploads/{category}/user-{current user id}/` (`type` is ignored)

The endpoint reads the folder directly, not the database. It returns `{ "files": [{ "filename": "..." }] }` with every file in the folder, including `thumb-` files. A missing folder gives an empty list. A valid session is required (`401` otherwise).

## Size limits

- **`BODY_SIZE_LIMIT`** (default `10485760`, 10 MB) is the request body limit of the Node adapter and applies to every request. `saveFile` sends the file as base64 inside the request, which is about 4/3 of the file size, so with the default limit files above roughly 7.5 MB are rejected.
- `saveFile` has no size check of its own. The `maxFileSize` prop of `FileUploader` is checked in the browser only.
- File names are limited to 255 characters.

## FileUploader component

`src/lib/components/file-uploader/` contains a drag-and-drop uploader that calls `saveFile`.

```svelte
<script lang="ts">
  import { FileUploader } from '$lib/components/file-uploader';
  import type { UploadResult, UploadError } from '$lib/components/file-uploader';

  function handleUploadComplete(result: UploadResult) {
    if (result.success && result.file) {
      console.log(result.file.id, result.file.url, result.file.thumbnailUrl);
    }
  }

  function handleError(error: UploadError) {
    console.error(error.code, error.message);
  }
</script>

<FileUploader
  category="backgrounds"
  scope="user"
  mode="instant"
  fileType="image"
  allowedExtensions={['jpg', 'jpeg', 'png', 'webp']}
  maxFileSize={5 * 1024 * 1024}
  generateThumbnail={true}
  onUploadComplete={handleUploadComplete}
  onError={handleError}
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `category` | `string` | – (required) | Passed to `saveFile` |
| `scope` | `'shared' \| 'user'` | – (required) | Passed to `saveFile` |
| `mode` | `'standard' \| 'instant'` | `'standard'` | See below |
| `maxFileSize` | `number` | `10485760` (10 MB) | Max. size in bytes, checked in the browser |
| `maxFiles` | `number` | `1` | Max. number of files; above 1 the file picker allows multiple selection (standard mode only) |
| `fileType` | `'image' \| 'document' \| 'mixed'` | `'mixed'` | Sets the allowed extensions in the browser |
| `allowedExtensions` | `string[]` | `[]` | Overrides the extensions derived from `fileType` |
| `generateThumbnail` | `boolean` | `false` | Passed to `saveFile` |
| `maxImageWidth` | `number` | – | Passed to `saveFile` |
| `maxImageHeight` | `number` | – | Passed to `saveFile` |
| `showInstructions` | `boolean` | `true` | Shows the allowed extensions and the size limit |
| `onUploadComplete` | `(result: UploadResult) => void` | – | Called after each successful upload |
| `onError` | `(error: UploadError) => void` | – | Called on validation or upload errors |
| `onUploadStart` | `() => void` | – | Called when an upload starts (instant mode only) |

Extensions allowed in the browser by `fileType`:

- `image`: `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `bmp`
- `document`: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `txt`, `csv`, `odt`
- `mixed`: any extension

These are browser-side checks only; the server still applies the MIME detection described above.

### Modes

- **`standard`**: selected files go into a list with status and progress. The user starts the upload with a button; files are uploaded one after the other, and `onUploadComplete` is called for each.
- **`instant`**: a compact single-line uploader. The first selected file is uploaded right away; `onUploadStart` is called before the upload.

### Result types

```typescript
interface UploadResult {
  success: boolean;
  file?: {
    id: string;            // StoredFile.id (publicId)
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  };
  error?: string;
}

interface UploadError {
  code: string;    // INVALID_EXTENSION, FILE_TOO_LARGE, TOO_MANY_FILES, UPLOAD_ERROR
  message: string;
  field?: string;
}
```

## File repository

For direct database access in server code use `fileRepository` (a singleton of the `FileRepository` class). It is not exported from the module's `index.ts`, import it from its own file:

```typescript
import { fileRepository } from '$lib/server/storage/file-repository';

const file = await fileRepository.findByPublicId(fileId);
const avatars = await fileRepository.findByCategory('avatars', 'user', userId);
```

| Method | Returns | Description |
|---|---|---|
| `create(data: FileInsertModel)` | `Promise<StoredFile>` | Inserts a row into `platform.files` |
| `findByPublicId(publicId)` | `Promise<StoredFile \| undefined>` | Finds a file by its UUID |
| `findByCategory(category, scope, userId?)` | `Promise<StoredFile[]>` | `shared`: all shared files in the category; `user`: the given user's files (empty list without `userId`) |
| `findByUserId(userId)` | `Promise<StoredFile[]>` | Every file with that `userId` |
| `delete(publicId)` | `Promise<boolean>` | Deletes the row; `false` if it did not exist |
| `findRawByPublicId(publicId)` | `Promise<FileSelectModel \| undefined>` | Raw database row, including `thumbnailPath` |

The repository only handles the database. To touch the files themselves, use the helpers in `filesystem.ts`: `saveToFileSystem`, `readFromFileSystem`, `deleteFromFileSystem` (all take paths relative to `uploads/` and throw `StorageError`), `validatePath`, `sanitizeFilename`, `generateUniqueFilename` and `generateStoragePath`.
