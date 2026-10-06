---
title: Fájlkezelés
description: A core saját fájltárolója – saveFile, listFiles, deleteFile, az /api/files végpontok, a FileUploader komponens és a fileRepository
---

:::note
Ez az oldal a core saját fájltárolóját írja le, amelyet a beépített alkalmazások használnak (profilképek, asztali hátterek). A pluginok nem közvetlenül ezt használják: ők a `context.files` szolgáltatáson keresztül tárolnak fájlokat, lásd [Plugin fájltárolás](/hu/plugins-files/).
:::

## Áttekintés

A fájlok tartalma a lemezre, az `uploads/` mappába kerül, a metaadatok a `platform.files` táblába. A kód két helyen található:

| Hely | Tartalom |
|---|---|
| `src/lib/storage/` | A böngészőből hívható remote functionök: `saveFile`, `listFiles`, `deleteFile`, `deleteBackground` |
| `src/lib/server/storage/` | Csak szerveren futó kód: `filesystem.ts`, `file-repository.ts`, `types.ts`, `schemas.ts`, valamint a remote functionök szerveroldali másolatai és a `getFileMetadata` |

Minden remote function bejelentkezett felhasználót igényel. Ha nincs, `{ success: false, error: 'User not authenticated' }` a válasz. A hibák az eredményben jönnek vissza, nem kivételként.

## Kategóriák és scope-ok

Minden fájlnak van **kategóriája** és **scope-ja**.

- **Kategória**: kisbetűs név, amely illeszkedik a `^[a-z0-9-]+$` mintára (legfeljebb 100 karakter), pl. `avatars` vagy `backgrounds`. A `STORAGE_CONFIG.allowedCategories` a core által használt kategóriákat sorolja fel: `backgrounds`, `documents`, `avatars`, `images`. Ezt a listát csak az `/api/files/list` ellenőrzi; a `saveFile` minden mintának megfelelő nevet elfogad.
- **Scope**: `'shared'` vagy `'user'`. A megosztott (shared) fájlokat minden bejelentkezett felhasználó olvashatja. A user fájlok a feltöltőhöz tartoznak, és egy `user-{userId}` mappába kerülnek.

## Tárolási struktúra

Az `uploads/` mappa a folyamat munkakönyvtárához képest értendő (a `getUploadsPath()` a `path.join(process.cwd(), 'uploads')` értéket adja vissza).

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
└── plugin-files/        # plugin tárhely, az /api/files soha nem szolgálja ki
```

A `saveFile` mindig az `uploads/{category}/{shared | user-{userId}}/{filename}` útvonalra ír. Mélyebb mappákat nem hoz létre; az olyan almappák, mint a `backgrounds/shared/image/`, csak akkor léteznek, ha más módon kerültek oda fájlok.

Mentés előtt a fájlnév tisztításra kerül: a név részben csak `a-z A-Z 0-9 - _` marad, a kiterjesztésben csak betű és szám, a teljes hossz legfeljebb 255 karakter. Ha már létezik ilyen nevű fájl, egy 8 karakteres véletlen utótagot kap (`photo-1a2b3c4d.jpg`).

## Remote functionök

```typescript
import { saveFile } from '$lib/storage/save-file.remote.js';
import { listFiles } from '$lib/storage/list-files.remote.js';
import { deleteFile } from '$lib/storage/delete-file.remote.js';
```

Siker esetén `StoredFile` objektumot (vagy ezek listáját) adják vissza:

```typescript
interface StoredFile {
  id: string;            // publicId (UUID)
  filename: string;      // a tárolt (tisztított, esetleg utótagolt) név
  originalName: string;  // a kliens által küldött név
  category: string;
  scope: 'shared' | 'user';
  userId: number | null; // shared fájloknál null
  mimeType: string;
  size: number;          // bájt, a képfeldolgozás után
  storagePath: string;   // az uploads/-hoz képest, pl. avatars/user-42/photo.jpg
  url: string;           // /api/files/{category}/{shared|user-{id}}/{filename}
  thumbnailUrl?: string; // /api/files/{thumbnailPath}
  createdAt: Date;
}
```

### saveFile

```typescript
const result = await saveFile({
  fileData: dataUrl,          // base64, "data:...;base64," előtag is lehet
  fileName: 'photo.jpg',      // 1–255 karakter
  mimeType: 'image/jpeg',     // a kliens által megadott típus, lásd lent a MIME felismerést
  category: 'avatars',
  scope: 'user',
  options: {
    generateThumbnail: true,  // kötelező
    maxImageWidth: 1920,      // opcionális, >= 1
    maxImageHeight: 1080      // opcionális, >= 1
  }
});

if (result.success) {
  console.log(result.file.id, result.file.url);
} else {
  console.error(result.error);
}
```

Visszatérési érték: `{ success: boolean; file?: StoredFile; error?: string }`.

A szerver lépései:

1. Dekódolja a base64 adatot, és a tartalom alapján ellenőrzi a MIME típust (lásd lent).
2. Képeknél a `sharp` segítségével arányosan átméretez a `maxImageWidth` / `maxImageHeight` értékre (ha meg vannak adva). Ha a `generateThumbnail` értéke `true`, bélyegképet is ment (legfeljebb 200×200 px) `thumb-{fileName}` néven ugyanabba a mappába.
3. Kiírja a fájlt a lemezre, és beszúr egy sort a `platform.files` táblába, új UUID-val `publicId`-ként. `scope: 'user'` esetén a `userId` az aktuális felhasználó, `'shared'` esetén `null`.

### MIME felismerés

A szerver nem bízik a megadott `mimeType` értékben. A `file-type` csomaggal a fájl tartalmából állapítja meg a típust, és csak ezeket fogadja el (a szerver mindig ezt a listát használja, a feltöltő `fileType` propjától függetlenül):

- Képek: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, `image/bmp`
- Dokumentumok: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), ODT, `text/plain`, `text/csv`

A sima szöveg és a CSV tartalom alapján nem ismerhető fel, ezért ezeknél a megadott `mimeType` elfogadható, ha `text/plain` vagy `text/csv`. Minden más fel nem ismerhető fájl `Unable to detect file type` hibával elutasításra kerül. Az adatbázisba a felismert típus kerül.

### listFiles

```typescript
const result = await listFiles({ category: 'avatars', scope: 'user' });
// { success: boolean; files: StoredFile[]; error?: string }
```

Az adatbázisból olvas. `scope: 'user'` esetén csak az aktuális felhasználó fájljait adja vissza a kategóriában, `scope: 'shared'` esetén a kategória összes megosztott fájlját. Lapozás és rendezés nincs.

### deleteFile

```typescript
const result = await deleteFile({ fileId: file.id });
// { success: boolean; error?: string }
```

Törli a fájlt és a bélyegképét a lemezről, majd az adatbázis sort. Ha a fájl már nincs a lemezen, a sort akkor is törli. A felhasználó csak azokat a fájlokat törölheti, amelyek `userId` értéke az övé. A megosztott fájlok `userId: null` értékkel mentődnek, ezért a jelenlegi kódban a `deleteFile` ezek törlését elutasítja.

### deleteBackground

A `$lib/storage/delete-background.remote.js` fájlban lévő `deleteBackground({ filename })` törli a `backgrounds/user-{userId}/{filename}` fájlt és a hozzá tartozó `thumb-` fájlt a lemezről. Az adatbázishoz nem nyúl.

### getFileMetadata

A `getFileMetadata({ fileId })` csak a `$lib/server/storage/` alatt létezik (az ottani `index.ts` exportálja). Visszatérési érték: `{ success, file?, error? }`. A megosztott fájlokat minden bejelentkezett felhasználó láthatja, a user fájlokat csak a tulajdonosuk.

## Fájlok kiszolgálása: `GET /api/files/...`

```
GET /api/files/{category}/{shared | user-{id}}/{filename}
```

A `StoredFile` `url` és `thumbnailUrl` mezői erre a végpontra mutatnak. Szabályok:

| Ellenőrzés | Eredmény |
|---|---|
| Nincs érvényes session | `401` |
| Az első útvonal elem `plugin-files` | `404` (a plugin fájlokat csak a plugin aláírt linkjei szolgálják ki) |
| 3-nál kevesebb elem, vagy a második nem `shared` / `user-{szám}` | `400` |
| Az útvonal `..`-t, null bájtot tartalmaz, vagy abszolút | `400` |
| Másik felhasználó `user-{id}` mappája | `403`, kivéve az `avatars` kategóriát, ahol bármely bejelentkezett felhasználó olvashatja |
| A fájl nem létezik | `404` |

A megosztott fájlokat bármely bejelentkezett felhasználó olvashatja. A scope után további útvonal elemek is lehetnek (pl. `/api/files/backgrounds/shared/image/sunset.jpg`). A kategóriát a végpont nem veti össze az `allowedCategories` listával.

Sikeres válasz esetén:

- a `Content-Type` a fájl kiterjesztéséből adódik (nem az adatbázis rekordból), ismeretlen kiterjesztésnél `application/octet-stream`
- `Cache-Control: public, max-age=3600`
- `X-Content-Type-Options: nosniff`

A hibák JSON formában jönnek vissza: `{ "error": "..." }`.

## Mappa listázása: `GET /api/files/list`

```
GET /api/files/list?category=backgrounds&scope=shared&type=image
```

| Paraméter | Kötelező | Leírás |
|---|---|---|
| `category` | Igen | Az `allowedCategories` egyike kell legyen (`backgrounds`, `documents`, `avatars`, `images`), különben `400 Invalid category` |
| `scope` | Igen | `shared` vagy `user`, különben `400 Invalid scope` |
| `type` | Nem | Almappa neve (`^[a-z0-9-]+$`), csak `scope=shared` esetén számít |

A beolvasott mappa:

- `scope=shared`: `uploads/{category}/shared/` vagy `uploads/{category}/shared/{type}/`
- `scope=user`: `uploads/{category}/user-{aktuális user id}/` (a `type` figyelmen kívül marad)

A végpont közvetlenül a mappát olvassa, nem az adatbázist. A válasz `{ "files": [{ "filename": "..." }] }`, benne a mappa összes fájljával, a `thumb-` fájlokat is beleértve. Nem létező mappa esetén üres listát ad. Érvényes session szükséges (különben `401`).

## Méretkorlátok

- A **`BODY_SIZE_LIMIT`** (alapértelmezés `10485760`, 10 MB) a Node adapter kérésméret-korlátja, minden kérésre vonatkozik. A `saveFile` a fájlt base64 formában küldi a kérésben, ami a fájlméret kb. 4/3-a, így az alapértelmezett korláttal a kb. 7,5 MB-nál nagyobb fájlok elutasításra kerülnek.
- A `saveFile` maga nem ellenőriz méretet. A `FileUploader` `maxFileSize` propját csak a böngésző ellenőrzi.
- A fájlnév legfeljebb 255 karakter lehet.

## FileUploader komponens

A `src/lib/components/file-uploader/` mappában egy drag-and-drop feltöltő található, amely a `saveFile`-t hívja.

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

### Propok

| Prop | Típus | Alapértelmezés | Leírás |
|---|---|---|---|
| `category` | `string` | – (kötelező) | Továbbadódik a `saveFile`-nak |
| `scope` | `'shared' \| 'user'` | – (kötelező) | Továbbadódik a `saveFile`-nak |
| `mode` | `'standard' \| 'instant'` | `'standard'` | Lásd lent |
| `maxFileSize` | `number` | `10485760` (10 MB) | Maximális méret bájtban, a böngésző ellenőrzi |
| `maxFiles` | `number` | `1` | Maximális fájlszám; 1 felett a fájlválasztóban több fájl is kijelölhető (csak standard módban) |
| `fileType` | `'image' \| 'document' \| 'mixed'` | `'mixed'` | A böngészőben engedélyezett kiterjesztéseket határozza meg |
| `allowedExtensions` | `string[]` | `[]` | Felülírja a `fileType` alapján adódó kiterjesztéseket |
| `generateThumbnail` | `boolean` | `false` | Továbbadódik a `saveFile`-nak |
| `maxImageWidth` | `number` | – | Továbbadódik a `saveFile`-nak |
| `maxImageHeight` | `number` | – | Továbbadódik a `saveFile`-nak |
| `showInstructions` | `boolean` | `true` | Megjeleníti az engedélyezett kiterjesztéseket és a méretkorlátot |
| `onUploadComplete` | `(result: UploadResult) => void` | – | Minden sikeres feltöltés után meghívódik |
| `onError` | `(error: UploadError) => void` | – | Validációs vagy feltöltési hiba esetén hívódik meg |
| `onUploadStart` | `() => void` | – | A feltöltés indulásakor hívódik meg (csak instant módban) |

A böngészőben engedélyezett kiterjesztések `fileType` szerint:

- `image`: `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `bmp`
- `document`: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `txt`, `csv`, `odt`
- `mixed`: bármilyen kiterjesztés

Ezek csak böngészőoldali ellenőrzések; a szerver ettől függetlenül elvégzi a fent leírt MIME felismerést.

### Módok

- **`standard`**: a kiválasztott fájlok listába kerülnek állapottal és folyamatjelzővel. A feltöltést a felhasználó egy gombbal indítja; a fájlok egymás után töltődnek fel, és mindegyiknél meghívódik az `onUploadComplete`.
- **`instant`**: kompakt, egysoros feltöltő. Az első kiválasztott fájl azonnal feltöltődik; előtte meghívódik az `onUploadStart`.

### Eredmény típusok

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

## Fájl repository

Szerveroldali kódban a közvetlen adatbázis-hozzáféréshez a `fileRepository` használható (a `FileRepository` osztály egyetlen példánya). A modul `index.ts`-e nem exportálja, a saját fájljából kell importálni:

```typescript
import { fileRepository } from '$lib/server/storage/file-repository';

const file = await fileRepository.findByPublicId(fileId);
const avatars = await fileRepository.findByCategory('avatars', 'user', userId);
```

| Metódus | Visszatérési érték | Leírás |
|---|---|---|
| `create(data: FileInsertModel)` | `Promise<StoredFile>` | Beszúr egy sort a `platform.files` táblába |
| `findByPublicId(publicId)` | `Promise<StoredFile \| undefined>` | Fájl keresése UUID alapján |
| `findByCategory(category, scope, userId?)` | `Promise<StoredFile[]>` | `shared`: a kategória összes megosztott fájlja; `user`: a megadott felhasználó fájljai (`userId` nélkül üres lista) |
| `findByUserId(userId)` | `Promise<StoredFile[]>` | Az adott `userId`-hoz tartozó összes fájl |
| `delete(publicId)` | `Promise<boolean>` | Törli a sort; `false`, ha nem létezett |
| `findRawByPublicId(publicId)` | `Promise<FileSelectModel \| undefined>` | A nyers adatbázis sor, a `thumbnailPath` mezővel együtt |

A repository csak az adatbázist kezeli. A fájlokhoz magukhoz a `filesystem.ts` segédfüggvényei valók: `saveToFileSystem`, `readFromFileSystem`, `deleteFromFileSystem` (mindegyik az `uploads/`-hoz relatív útvonalat vár, és `StorageError`-t dob), `validatePath`, `sanitizeFilename`, `generateUniqueFilename` és `generateStoragePath`.
