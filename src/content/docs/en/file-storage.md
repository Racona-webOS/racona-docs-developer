---
title: File Storage
description: Uploading, downloading, deleting files and the file repository pattern
---

## Overview

Racona file handling is implemented in the `src/lib/server/storage/` module. Files are stored on the server, with metadata in the database.

## Remote Functions

File handling operations are available as remote functions:

```typescript
import {
  saveFile,
  listFiles,
  getFileMetadata,
  deleteFile
} from '$lib/server/storage';
```

### Uploading a File

```typescript
import { saveFile } from '$lib/server/storage/save-file.remote';

const result = await saveFile({
  filename: 'document.pdf',
  content: base64Content,  // base64 encoded content
  mimeType: 'application/pdf',
  directory: 'documents'   // optional subdirectory
});

if (result.success) {
  console.log(result.fileId);  // new file ID
  console.log(result.url);     // download URL
}
```

### Listing Files

```typescript
import { listFiles } from '$lib/server/storage/list-files.remote';

const result = await listFiles({
  directory: 'documents',
  page: 1,
  pageSize: 20
});

if (result.success) {
  console.log(result.data);       // array of file metadata
  console.log(result.pagination); // pagination data
}
```

### Getting File Metadata

```typescript
import { getFileMetadata } from '$lib/server/storage/get-file-metadata.remote';

const result = await getFileMetadata({ fileId: '123' });

if (result.success) {
  console.log(result.data.filename);
  console.log(result.data.size);
  console.log(result.data.mimeType);
  console.log(result.data.url);
}
```

### Deleting a File

```typescript
import { deleteFile } from '$lib/server/storage/delete-file.remote';

const result = await deleteFile({ fileId: '123' });
```

## API Endpoint

Files are also accessible via the `/api/files/` endpoint:

```
GET  /api/files/[fileId]          # Download file
POST /api/files/upload            # Upload file
DELETE /api/files/[fileId]        # Delete file
```

## FileUploader Component

The `src/lib/components/file-uploader/` contains a ready-made uploader component:

```svelte
<script lang="ts">
  import FileUploader from '$lib/components/file-uploader/FileUploader.svelte';

  function handleUpload(fileId: string, url: string) {
    console.log('Uploaded:', fileId, url);
  }
</script>

<FileUploader
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUpload={handleUpload}
/>
```

## File Repository

For direct database access in server-side code, use `fileRepository`:

```typescript
import { fileRepository } from '$lib/server/storage/file-repository';

// Get file metadata
const file = await fileRepository.findById(fileId);

// List user's files
const files = await fileRepository.findByUserId(userId);
```
