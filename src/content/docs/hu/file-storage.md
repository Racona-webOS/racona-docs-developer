---
title: Fájlkezelés
description: Fájlok feltöltése, letöltése, törlése és a fájl repository minta
---

## Áttekintés

A Rocona fájlkezelése a `src/lib/server/storage/` modulban van implementálva. A fájlok a szerveren tárolódnak, metaadataik az adatbázisban.

## Remote functions

A fájlkezelési műveletek remote functionökként érhetők el:

```typescript
import {
  saveFile,
  listFiles,
  getFileMetadata,
  deleteFile
} from '$lib/server/storage';
```

### Fájl feltöltése

```typescript
import { saveFile } from '$lib/server/storage/save-file.remote';

const result = await saveFile({
  filename: 'document.pdf',
  content: base64Content,  // base64 kódolt tartalom
  mimeType: 'application/pdf',
  directory: 'documents'   // opcionális almappa
});

if (result.success) {
  console.log(result.fileId);  // az új fájl azonosítója
  console.log(result.url);     // letöltési URL
}
```

### Fájlok listázása

```typescript
import { listFiles } from '$lib/server/storage/list-files.remote';

const result = await listFiles({
  directory: 'documents',
  page: 1,
  pageSize: 20
});

if (result.success) {
  console.log(result.data);       // fájl metaadatok tömbje
  console.log(result.pagination); // lapozási adatok
}
```

### Fájl metaadatok lekérése

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

### Fájl törlése

```typescript
import { deleteFile } from '$lib/server/storage/delete-file.remote';

const result = await deleteFile({ fileId: '123' });
```

## API végpont

A fájlok a `/api/files/` végponton keresztül is elérhetők:

```
GET  /api/files/[fileId]          # Fájl letöltése
POST /api/files/upload            # Fájl feltöltése
DELETE /api/files/[fileId]        # Fájl törlése
```

## FileUploader komponens

Az `src/lib/components/file-uploader/` tartalmaz egy kész feltöltő komponenst:

```svelte
<script lang="ts">
  import FileUploader from '$lib/components/file-uploader/FileUploader.svelte';

  function handleUpload(fileId: string, url: string) {
    console.log('Feltöltve:', fileId, url);
  }
</script>

<FileUploader
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUpload={handleUpload}
/>
```

## Fájl repository

Közvetlen adatbázis-hozzáféréshez a `fileRepository` használható szerver oldali kódban:

```typescript
import { fileRepository } from '$lib/server/storage/file-repository';

// Fájl metaadatok lekérése
const file = await fileRepository.findById(fileId);

// Felhasználó fájljainak listázása
const files = await fileRepository.findByUserId(userId);
```
