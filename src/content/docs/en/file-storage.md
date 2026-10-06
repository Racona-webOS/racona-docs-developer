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
| `src/lib/storage/` | Remote functions callable from the browser: `saveFile`, `listFiles`, `deleteFile`, `getFileMetadata`, `deleteBackground`; plus `schemas.ts` (input schemas, `RESERVED_CATEGORIES`), `types.ts` and `limits.ts` (upload size limit, usable in the browser too) |
| `src/lib/server/storage/` | Server-only code: `filesystem.ts` (disk operations), `file-repository.ts` (database), `file-service.ts` (deleting a file with its thumbnail and row, orphan cleanup), `policy.ts` (permission rules), `limits.ts` (server size limit), `content-type.ts` (response headers), `stored-file.ts` (row → `StoredFile`, URLs), `types.ts` (`STORAGE_CONFIG`, `StorageError`) |

Every remote function requires a logged-in user. Without one they return `{ success: false, error: 'User not authenticated' }`. Errors are returned in the result, not thrown.

## Categories and scopes

Every file has a **category** and a **scope**.

- **Category**: a lowercase name that matches `^[a-z0-9-]+$` (max. 100 characters), for example `avatars` or `backgrounds`. `plugins` and `plugin-files` are reserved (`RESERVED_CATEGORIES` in `src/lib/storage/schemas.ts`), `saveFile` rejects them. `STORAGE_CONFIG.allowedCategories` lists the categories used by the core: `backgrounds`, `documents`, `avatars`, `images`. Only `/api/files/list` enforces this list; `saveFile` accepts any other name that matches the pattern.
- **Scope**: `'shared'` or `'user'`. Shared files can be read by every logged-in user; uploading and deleting them needs the `files.shared.manage` permission (see below). User files belong to the uploader and are stored in a `user-{userId}` folder.

### The `files.shared.manage` permission

The permission belongs to the `files` resource. The seed gives it to the Sysadmin role (which has every permission) and the Admin role. Migration `0010_files_shared_manage` adds it to existing databases and grants it to every role and group that has `settings.update`.

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
├── plugins/             # installed plugins, reserved
└── plugin-files/        # plugin storage, reserved, never served by /api/files
```

`saveFile` always writes to `uploads/{category}/{shared | user-{userId}}/{filename}`. It does not create deeper folders; subfolders such as `backgrounds/shared/image/` only exist if files are placed there by other means. Storage paths always use `/`, on Windows too.

File names are sanitized before saving: the name part keeps only `a-z A-Z 0-9 - _`, the extension keeps only letters and digits, and the total length is capped at 255 characters. A leading `thumb-` is removed from the name, so an uploaded file never looks like a thumbnail. If a file with that name already exists, an 8-character random suffix is added (`photo-1a2b3c4d.jpg`).

## Remote functions

```typescript
import { saveFile } from '$lib/storage/save-file.remote.js';
import { listFiles } from '$lib/storage/list-files.remote.js';
import { deleteFile } from '$lib/storage/delete-file.remote.js';
import { getFileMetadata } from '$lib/storage/get-file-metadata.remote.js';
```

All of them are also exported from `$lib/storage`. They return a `StoredFile` (or a list of them) on success:

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

1. For `scope: 'shared'`, checks the `files.shared.manage` permission. Without it the result is `Permission denied: shared files require the files.shared.manage permission`.
2. Checks the size against the server limit (see [Size limits](#size-limits)); a larger file fails with `File is too large (max 7 MB)`.
3. Decodes the base64 data and checks the MIME type from the content (see below).
4. For images, resizes proportionally to `maxImageWidth` / `maxImageHeight` (if given) with `sharp`. If `generateThumbnail` is `true`, it also creates a thumbnail (max. 200×200 px).
5. Writes the file to disk, then the thumbnail as `thumb-{stored filename}` in the same folder, and inserts a row into `platform.files` with a new UUID as `publicId`. For `scope: 'user'` the `userId` is the current user, for `'shared'` it is `null`. If a step fails, the files already written are removed.

### MIME detection

The server does not trust the declared `mimeType`. It detects the type from the file content with the `file-type` package and accepts only these types (the server always uses this list, regardless of the uploader's `fileType` prop):

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), ODT, `text/plain`, `text/csv`

SVG and BMP are not accepted: SVG cannot be detected from the content and could run scripts, BMP cannot be read by `sharp`.

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

Deletes the file and its thumbnail from disk and then the database row. If the file is already missing from disk, it still deletes the row. Who may delete:

- user files: only the owner (`userId` equals the current user);
- shared files: users with the `files.shared.manage` permission.

### deleteBackground

`deleteBackground({ filename })` from `$lib/storage/delete-background.remote.js` deletes the current user's own background `backgrounds/user-{userId}/{filename}`. `filename` must be a plain file name (no `/` or `\`). If the background has a `platform.files` row, the file, its thumbnail and the row are deleted. Older backgrounds without a row are only removed from disk together with their `thumb-` file.

### getFileMetadata

```typescript
const result = await getFileMetadata({ fileId });
// { success: boolean; file?: StoredFile; error?: string }
```

Shared files are visible to every logged-in user, user files only to their owner.

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

- `Content-Type` from the MIME type stored in `platform.files` (detected from the content at upload; a thumbnail uses its file's row). Files without a row (for example backgrounds copied in at install) get a type from a fixed extension list, unknown extensions get `application/octet-stream`.
- HTML, JavaScript, SVG and XML are always sent as `application/octet-stream` with `Content-Disposition: attachment`.
- `Content-Disposition: inline` for images, audio, video, PDF and plain text (`text/plain`, `text/csv`), `attachment` for everything else.
- `Cache-Control: private, max-age=3600` and `Vary: Cookie`, so proxies and CDNs do not store files that need a login
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
| `type` | No | Subfolder name, must match `^[a-z0-9-]+$` (otherwise `400 Invalid type`); only used with `scope=shared` |

The folder that is read:

- `scope=shared`: `uploads/{category}/shared/` or `uploads/{category}/shared/{type}/`
- `scope=user`: `uploads/{category}/user-{current user id}/` (`type` is ignored)

The endpoint reads the folder directly, not the database. It returns `{ "files": [{ "filename": "..." }] }` with the files in the folder; subfolders and `thumb-` files are left out. A missing folder gives an empty list. A valid session is required (`401` otherwise).

## Size limits

`saveFile` sends the file base64-encoded inside one request, which is about 4/3 of the file size. The request has to fit into **`BODY_SIZE_LIMIT`** (the request body limit of the Node adapter, default `10485760`, 10 MB), so about three quarters of it is usable for the file.

- **Server**: `saveFile` rejects files above `getMaxUploadBytes()` (`src/lib/server/storage/limits.ts`). The value is computed from `BODY_SIZE_LIMIT` with `maxUploadBytesForBodyLimit()` (`src/lib/storage/limits.ts`): 64 KB is kept for the rest of the request, three quarters of the remainder is the limit, rounded down to whole MB above 1 MB. With the default limit this is 7 MB (`DEFAULT_MAX_UPLOAD_BYTES`).
- **FileUploader**: the `maxFileSize` default is also 7 MB. It is based on the default `BODY_SIZE_LIMIT`; a larger value only works if `BODY_SIZE_LIMIT` is raised as well. If the server rejects the request because of its size, the uploader shows a clear message.
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
| `scope` | `'shared' \| 'user'` | – (required) | Passed to `saveFile`; `shared` needs the `files.shared.manage` permission |
| `mode` | `'standard' \| 'instant'` | `'standard'` | See below |
| `maxFileSize` | `number` | `DEFAULT_MAX_UPLOAD_BYTES` (7 MB) | Max. size in bytes, checked in the browser; see [Size limits](#size-limits) |
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

- `image`: `jpg`, `jpeg`, `png`, `gif`, `webp`
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
    filename?: string;     // stored name (may differ from originalName)
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

## Cleanup of deleted users' files

When a user is deleted, `platform.files.user_id` is set to `null`, so their personal files can no longer be reached. The core job `core.orphan-files-cleanup` runs daily (04:30) and deletes these files, their thumbnails and their rows (`cleanupOrphanedUserFiles` in `file-service.ts`).

## File repository

For direct database access in server code use `fileRepository` (a singleton of the `FileRepository` class):

```typescript
import { fileRepository } from '$lib/server/storage';

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
| `findRawByPath(storagePath)` | `Promise<FileSelectModel \| undefined>` | Raw row whose file or thumbnail has this path (relative to `uploads/`) |
| `findOrphanedUserFiles(limit)` | `Promise<FileSelectModel[]>` | User files whose `userId` is `null` (deleted users) |

The repository only handles the database. To delete a file together with its thumbnail and row, use `removeStoredFile(record)` from `file-service.ts` (permissions are checked by the caller). To touch the files themselves, use the helpers in `filesystem.ts`: `saveToFileSystem`, `readFromFileSystem`, `deleteFromFileSystem` (all take paths relative to `uploads/` and throw `StorageError`), `validatePath`, `sanitizeFilename`, `generateUniqueFilename` and `generateStoragePath`.
