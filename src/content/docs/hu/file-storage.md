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
| `src/lib/storage/` | A böngészőből hívható remote functionök: `saveFile`, `listFiles`, `deleteFile`, `getFileMetadata`, `deleteBackground`; továbbá a `schemas.ts` (bemeneti sémák, `RESERVED_CATEGORIES`), a `types.ts` és a `limits.ts` (feltöltési mérethatár, a böngészőben is használható) |
| `src/lib/server/storage/` | Csak szerveren futó kód: `filesystem.ts` (lemezműveletek), `file-repository.ts` (adatbázis), `file-service.ts` (fájl törlése a bélyegképével és a rekordjával, árva fájlok takarítása), `policy.ts` (jogosultsági szabályok), `limits.ts` (szerveroldali mérethatár), `content-type.ts` (válaszfejlécek), `stored-file.ts` (rekord → `StoredFile`, URL-ek), `types.ts` (`STORAGE_CONFIG`, `StorageError`) |

Minden remote function bejelentkezett felhasználót igényel. Ha nincs, `{ success: false, error: 'User not authenticated' }` a válasz. A hibák az eredményben jönnek vissza, nem kivételként.

## Kategóriák és scope-ok

Minden fájlnak van **kategóriája** és **scope-ja**.

- **Kategória**: kisbetűs név, amely illeszkedik a `^[a-z0-9-]+$` mintára (legfeljebb 100 karakter), pl. `avatars` vagy `backgrounds`. A `plugins` és a `plugin-files` fenntartott név (`RESERVED_CATEGORIES` a `src/lib/storage/schemas.ts`-ben), ezeket a `saveFile` elutasítja. A `STORAGE_CONFIG.allowedCategories` a core által használt kategóriákat sorolja fel: `backgrounds`, `documents`, `avatars`, `images`. Ezt a listát csak az `/api/files/list` ellenőrzi; a `saveFile` minden más, a mintának megfelelő nevet elfogad.
- **Scope**: `'shared'` vagy `'user'`. A megosztott (shared) fájlokat minden bejelentkezett felhasználó olvashatja; feltölteni és törölni őket a `files.shared.manage` jogosultsággal lehet (lásd lent). A user fájlok a feltöltőhöz tartoznak, és egy `user-{userId}` mappába kerülnek.

### A `files.shared.manage` jogosultság

A jogosultság a `files` erőforráshoz tartozik. A seed a Rendszergazda (minden jogosultsággal rendelkező) és az Adminisztrátor szerepkörnek adja meg. A `0010_files_shared_manage` migráció a meglévő adatbázisokhoz is hozzáadja, és minden olyan szerepkörnek és csoportnak megadja, amelynek van `settings.update` jogosultsága.

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
├── plugins/             # telepített pluginok, fenntartott
└── plugin-files/        # plugin tárhely, fenntartott, az /api/files soha nem szolgálja ki
```

A `saveFile` mindig az `uploads/{category}/{shared | user-{userId}}/{filename}` útvonalra ír. Mélyebb mappákat nem hoz létre; az olyan almappák, mint a `backgrounds/shared/image/`, csak akkor léteznek, ha más módon kerültek oda fájlok. A tárolási útvonalakban mindig `/` az elválasztó, Windows alatt is.

Mentés előtt a fájlnév tisztításra kerül: a név részben csak `a-z A-Z 0-9 - _` marad, a kiterjesztésben csak betű és szám, a teljes hossz legfeljebb 255 karakter. A név elejéről a `thumb-` előtag lekerül, így feltöltött fájl soha nem látszik bélyegképnek. Ha már létezik ilyen nevű fájl, egy 8 karakteres véletlen utótagot kap (`photo-1a2b3c4d.jpg`).

## Remote functionök

```typescript
import { saveFile } from '$lib/storage/save-file.remote.js';
import { listFiles } from '$lib/storage/list-files.remote.js';
import { deleteFile } from '$lib/storage/delete-file.remote.js';
import { getFileMetadata } from '$lib/storage/get-file-metadata.remote.js';
```

Mindegyiket a `$lib/storage` is exportálja. Siker esetén `StoredFile` objektumot (vagy ezek listáját) adják vissza:

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

1. `scope: 'shared'` esetén ellenőrzi a `files.shared.manage` jogosultságot. Ha nincs, a hiba: `Permission denied: shared files require the files.shared.manage permission`.
2. Összeveti a méretet a szerver mérethatárával (lásd [Méretkorlátok](#méretkorlátok)); a nagyobb fájl `File is too large (max 7 MB)` hibát ad.
3. Dekódolja a base64 adatot, és a tartalom alapján ellenőrzi a MIME típust (lásd lent).
4. Képeknél a `sharp` segítségével arányosan átméretez a `maxImageWidth` / `maxImageHeight` értékre (ha meg vannak adva). Ha a `generateThumbnail` értéke `true`, bélyegképet is készít (legfeljebb 200×200 px).
5. Kiírja a fájlt a lemezre, majd a bélyegképet `thumb-{tárolt fájlnév}` néven ugyanabba a mappába, és beszúr egy sort a `platform.files` táblába, új UUID-val `publicId`-ként. `scope: 'user'` esetén a `userId` az aktuális felhasználó, `'shared'` esetén `null`. Ha valamelyik lépés hibára fut, a már kiírt fájlokat törli.

### MIME felismerés

A szerver nem bízik a megadott `mimeType` értékben. A `file-type` csomaggal a fájl tartalmából állapítja meg a típust, és csak ezeket fogadja el (a szerver mindig ezt a listát használja, a feltöltő `fileType` propjától függetlenül):

- Képek: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Dokumentumok: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`), ODT, `text/plain`, `text/csv`

SVG és BMP nem tölthető fel: az SVG a tartalom alapján nem ismerhető fel, és szkriptet futtathatna, a BMP-t pedig a `sharp` nem tudja beolvasni.

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

Törli a fájlt és a bélyegképét a lemezről, majd az adatbázis sort. Ha a fájl már nincs a lemezen, a sort akkor is törli. Ki törölhet:

- user fájlt: csak a tulajdonosa (a `userId` az aktuális felhasználó);
- megosztott fájlt: a `files.shared.manage` jogosultsággal rendelkező felhasználó.

### deleteBackground

A `$lib/storage/delete-background.remote.js` fájlban lévő `deleteBackground({ filename })` az aktuális felhasználó saját hátterét törli: `backgrounds/user-{userId}/{filename}`. A `filename` csak fájlnév lehet (`/` és `\` nélkül). Ha a háttérnek van `platform.files` rekordja, a fájl, a bélyegkép és a rekord is törlődik. A rekord nélküli, régebbi hátterek csak a lemezről törlődnek, a `thumb-` fájljukkal együtt.

### getFileMetadata

```typescript
const result = await getFileMetadata({ fileId });
// { success: boolean; file?: StoredFile; error?: string }
```

A megosztott fájlokat minden bejelentkezett felhasználó láthatja, a user fájlokat csak a tulajdonosuk.

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

- a `Content-Type` a `platform.files` táblában tárolt MIME típus (feltöltéskor a tartalomból felismerve; a bélyegkép a fájlja rekordját használja). A rekord nélküli fájlok (pl. a telepítéskor bemásolt hátterek) típusa egy rögzített kiterjesztéslistából adódik, ismeretlen kiterjesztésnél `application/octet-stream`.
- HTML, JavaScript, SVG és XML mindig `application/octet-stream` típussal és `Content-Disposition: attachment` fejléccel megy ki.
- `Content-Disposition: inline` képeknél, hangnál, videónál, PDF-nél és sima szövegnél (`text/plain`, `text/csv`), minden másnál `attachment`.
- `Cache-Control: private, max-age=3600` és `Vary: Cookie`, így a proxyk és CDN-ek nem tárolják a bejelentkezéshez kötött fájlokat
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
| `type` | Nem | Almappa neve, illeszkednie kell a `^[a-z0-9-]+$` mintára (különben `400 Invalid type`); csak `scope=shared` esetén számít |

A beolvasott mappa:

- `scope=shared`: `uploads/{category}/shared/` vagy `uploads/{category}/shared/{type}/`
- `scope=user`: `uploads/{category}/user-{aktuális user id}/` (a `type` figyelmen kívül marad)

A végpont közvetlenül a mappát olvassa, nem az adatbázist. A válasz `{ "files": [{ "filename": "..." }] }`, benne a mappa fájljaival; az almappák és a `thumb-` fájlok kimaradnak. Nem létező mappa esetén üres listát ad. Érvényes session szükséges (különben `401`).

## Méretkorlátok

A `saveFile` a fájlt base64 kódolva, egyetlen kérésben küldi, ami a fájlméret kb. 4/3-a. A kérésnek bele kell férnie a **`BODY_SIZE_LIMIT`**-be (a Node adapter kérésméret-korlátja, alapértelmezés `10485760`, 10 MB), így ennek kb. háromnegyede használható a fájlra.

- **Szerver**: a `saveFile` elutasítja a `getMaxUploadBytes()` (`src/lib/server/storage/limits.ts`) értéknél nagyobb fájlokat. Az értéket a `maxUploadBytesForBodyLimit()` (`src/lib/storage/limits.ts`) számolja a `BODY_SIZE_LIMIT`-ből: 64 KB marad a kérés többi részének, a maradék háromnegyede a korlát, 1 MB felett egész MB-ra lefelé kerekítve. Az alapértelmezett korláttal ez 7 MB (`DEFAULT_MAX_UPLOAD_BYTES`).
- **FileUploader**: a `maxFileSize` alapértéke szintén 7 MB. Ez az alapértelmezett `BODY_SIZE_LIMIT`-hez igazodik; nagyobb érték csak akkor működik, ha a `BODY_SIZE_LIMIT` is nagyobb. Ha a szerver a kérést a mérete miatt elutasítja, a feltöltő érthető hibaüzenetet mutat.
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
| `scope` | `'shared' \| 'user'` | – (kötelező) | Továbbadódik a `saveFile`-nak; a `shared`-hez `files.shared.manage` jogosultság kell |
| `mode` | `'standard' \| 'instant'` | `'standard'` | Lásd lent |
| `maxFileSize` | `number` | `DEFAULT_MAX_UPLOAD_BYTES` (7 MB) | Maximális méret bájtban, a böngésző ellenőrzi; lásd [Méretkorlátok](#méretkorlátok) |
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

- `image`: `jpg`, `jpeg`, `png`, `gif`, `webp`
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
    filename?: string;     // a tárolt név (eltérhet az originalName-től)
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

## Törölt felhasználók fájljainak takarítása

Felhasználó törlésekor a `platform.files.user_id` értéke `null` lesz, így a saját fájljai senki számára nem érhetők el. A `core.orphan-files-cleanup` core feladat naponta (04:30-kor) törli ezeket a fájlokat, a bélyegképeiket és a rekordjaikat (`cleanupOrphanedUserFiles` a `file-service.ts`-ben).

## Fájl repository

Szerveroldali kódban a közvetlen adatbázis-hozzáféréshez a `fileRepository` használható (a `FileRepository` osztály egyetlen példánya):

```typescript
import { fileRepository } from '$lib/server/storage';

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
| `findRawByPath(storagePath)` | `Promise<FileSelectModel \| undefined>` | Az a nyers sor, amelynek a fájlja vagy a bélyegképe ezen az útvonalon van (az `uploads/`-hoz képest) |
| `findOrphanedUserFiles(limit)` | `Promise<FileSelectModel[]>` | A `null` `userId`-jú (törölt felhasználóhoz tartozó) user fájlok |

A repository csak az adatbázist kezeli. Ha egy fájlt a bélyegképével és a rekordjával együtt kell törölni, a `file-service.ts` `removeStoredFile(record)` függvénye való erre (a jogosultságot a hívó ellenőrzi). A fájlokhoz magukhoz a `filesystem.ts` segédfüggvényei valók: `saveToFileSystem`, `readFromFileSystem`, `deleteFromFileSystem` (mindegyik az `uploads/`-hoz relatív útvonalat vár, és `StorageError`-t dob), `validatePath`, `sanitizeFilename`, `generateUniqueFilename` és `generateStoragePath`.
