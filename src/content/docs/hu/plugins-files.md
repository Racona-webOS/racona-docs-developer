---
title: Fájltárolás pluginokban
description: Fájlok tárolása pluginból – context.files, aláírt fel- és letöltési linkek, sdk.files.upload, claim, korlátok és takarítás
---

## Áttekintés

Egy plugin fájlokat (szerződéseket, igazolásokat, szkennelt iratokat) tárolhat a core fájltárolójában. A fájlok a lemezre kerülnek, az adatbázisba csak a metaadatuk. A fájl azonosítóját a plugin a saját táblájában tartja.

Szükséges jogosultság: `file_access` a `manifest.json`-ban.

Hogy ki tölthet fel vagy le egy fájlt, azt a plugin dönti el. A böngésző soha nem kap állandó fájl URL-t: egy remote függvény ellenőrzi a hívó jogait, és csak utána kér a core-tól egy rövid életű linket, amely csak annak a felhasználónak működik.

:::note
A funkcióhoz a plugin fájltárolást tartalmazó Racona core kell. A szerver típusokat a `@racona/sdk/server` exportálja, az `sdk.files` a futásidejű SDK része a `0.7.0` verziótól.
:::

## Működés

```
Böngésző                        Remote függvényed                 Core
────────                        ─────────────────                 ────
1. remote.call('prepareUpload') → jogosultság-ellenőrzés
                                  files.createUploadUrl() ──────→ link aláírása
                                ← { uploadUrl }
2. sdk.files.upload(uploadUrl, file) ───────────────────────────→ fájl mentése
                                ← { fileId }                       (claim nélkül)
3. remote.call('attachFile', { fileId })
                                → files.claim(fileId) ──────────→ claimelt
                                  fileId a saját táblába

4. remote.call('getFileUrl')    → jogosultság-ellenőrzés
                                  files.createDownloadUrl() ────→ link aláírása
                                ← { url }
5. window.open(url) ────────────────────────────────────────────→ fájl streamelése
```

A soha be nem kötött (claim nélküli) feltöltések 24 óra után törlődnek, így egy félbehagyott feltöltés nem hagy hátra fájlt.

## Gyors kezdés

### 1. Jogosultság

```json title="manifest.json"
{
  "permissions": ["database", "remote_functions", "file_access"]
}
```

### 2. Szerver függvények

```ts title="server/functions.ts"
import type { RemoteFunctionContext } from '@racona/sdk/server';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

export async function prepareUpload(params: { invoiceId: number }, context: RemoteFunctionContext) {
	await requireInvoiceAccess(context, params.invoiceId); // saját jogosultság-ellenőrzés
	const { uploadUrl } = await context.files!.createUploadUrl({
		allowedMimeTypes: ALLOWED,
		maxBytes: 10 * 1024 * 1024,
		ref: `invoice:${params.invoiceId}`
	});
	return { uploadUrl };
}

export async function attachFile(
	params: { invoiceId: number; fileId: string },
	context: RemoteFunctionContext
) {
	await requireInvoiceAccess(context, params.invoiceId);
	const file = await context.files!.claim(params.fileId, { ref: `invoice:${params.invoiceId}` });
	try {
		await context.db.query(
			`INSERT INTO app__my_app.invoice_files (invoice_id, file_id, name, mime_type, size)
			 VALUES ($1, $2, $3, $4, $5)`,
			[params.invoiceId, file.id, file.originalName, file.mimeType, file.size]
		);
	} catch (err) {
		await context.files!.delete(file.id); // ne maradjon gazdátlan fájl
		throw err;
	}
	return { id: file.id, name: file.originalName };
}

export async function getFileUrl(params: { fileId: string }, context: RemoteFunctionContext) {
	const { rows } = await context.db.query(
		'SELECT invoice_id FROM app__my_app.invoice_files WHERE file_id = $1',
		[params.fileId]
	);
	if (rows.length === 0) throw new Error('A fájl nem található.');
	await requireInvoiceAccess(context, rows[0].invoice_id as number);
	return context.files!.createDownloadUrl(params.fileId, { disposition: 'inline' });
}
```

### 3. Kliens

```ts
const sdk = window.webOS!;

async function upload(invoiceId: number, file: File) {
	const { uploadUrl } = await sdk.remote.call<{ uploadUrl: string }>('prepareUpload', { invoiceId });
	const { fileId } = await sdk.files.upload(uploadUrl, file, {
		onProgress: ({ loaded, total }) => (progress = Math.round((loaded / total) * 100))
	});
	return sdk.remote.call('attachFile', { invoiceId, fileId });
}

async function open(fileId: string) {
	const { url } = await sdk.remote.call<{ url: string }>('getFileUrl', { fileId });
	window.open(url, '_blank', 'noopener');
}
```

## `context.files`

A remote függvényekben és az ütemezett feladatokban érhető el, ha a pluginnak van `file_access` joga. Minden metódus csak a plugin saját fájljait látja: egy másik plugin fájlazonosítója nem létező fájlként viselkedik.

| Metódus | Leírás |
|---|---|
| `createUploadUrl({ allowedMimeTypes, maxBytes?, ref?, ttlSeconds? })` | Aláírt feltöltési link a hívó felhasználónak. Alapból 5 percig érvényes, legfeljebb 15 percig. Ütemezett feladatban nem kérhető. |
| `claim(fileId, { ref? })` | A feltöltött fájl a saját adataidhoz kötve. Csak a feltöltő claimelheti (ütemezett feladatban bárki). Ismételt claim nem hiba. |
| `createDownloadUrl(fileId, { disposition?, ttlSeconds? })` | Aláírt letöltési link a hívó felhasználónak. Alapból 60 másodpercig érvényes, legfeljebb 10 percig. `inline`: a PDF és a kép a böngészőben nyílik meg, `attachment` (alapértelmezés): letöltés. Ütemezett feladatban nem kérhető. |
| `get(fileId)` | Metaadat (`PluginFileInfo`) vagy `null`. |
| `read(fileId)` | A tartalom bufferként (a teljes fájl a memóriába kerül), pl. ZIP-hez vagy email melléklethez. |
| `save({ data, fileName, allowedMimeTypes?, maxBytes?, ref? })` | Szerveren előállított fájl mentése (pl. export). Rögtön claimelt. |
| `delete(fileId)` | A fájl és a metaadata törlése. Nem létező fájl törlése nem hiba. |

`PluginFileInfo`: `id`, `originalName`, `mimeType`, `size`, `sha256`, `ref`, `createdBy`, `createdAt`, `claimedAt`.

A `ref` a saját címkéd (legfeljebb 255 karakter), pl. `employee-document:42`. A plugin eltávolítása után ezzel azonosíthatja egy adminisztrátor a fájlokat. Személyes adat ne kerüljön bele.

### Hibák

A metódusok `code` mezős hibát dobnak, amit a saját nyelveden fogalmazhatsz meg:

| Kód | Mikor |
|---|---|
| `FILE_NOT_FOUND` | A fájl nem létezik, vagy másik pluginé |
| `PERMISSION_DENIED` | Más felhasználó feltöltésének claimelése; link kérése ütemezett feladatban |
| `INVALID_INPUT` | Nem támogatott típus az `allowedMimeTypes`-ban, érvénytelen `maxBytes`, `ref` vagy `ttlSeconds` |
| `INVALID_MIME` | A tartalom nem engedett típusú (`save`) |
| `FILE_TOO_LARGE` | Nagyobb a `maxBytes`-nál vagy a core korlátjánál (`save`) |

## `sdk.files.upload(uploadUrl, file, options?)`

A fájlt nyers kéréstörzsként küldi (nem base64), így a 10 MB-os fájl sem gond. Az `options.onProgress` jelzi a haladást, az `options.signal` megszakítja. Csak a plugin saját feltöltési linkjeit fogadja el.

Az eredmény `{ fileId, originalName, mimeType, size }`. Ha a szerver elutasítja a fájlt, a hibának van `code` és `status` mezője:

| `code` | Státusz | Jelentés |
|---|---|---|
| `FILE_TOO_LARGE` | 413 | Nagyobb, mint amit a link enged |
| `INVALID_MIME` | 415 | A tartalom nem engedett típusú |
| `INVALID_TOKEN` | 403 | A link lejárt, vagy másik felhasználóé |
| `PERMISSION_DENIED` | 403 | A pluginnak nincs `file_access` joga (vagy inaktív) |
| `NETWORK_ERROR`, `ABORTED` | 0 | Megszakadt a kapcsolat, vagy a signal megszakította |

Önálló (standalone) fejlesztésnél a `MockFileService` szimulálja a feltöltést véletlen fájlazonosítóval; a `MockSDKConfig.files.upload` mezővel testre szabható.

## Fájltípusok és korlátok

- **Támogatott típusok:** PDF, JPEG, PNG, WEBP, DOCX, XLSX, ODT, ODS. A típust a core a fájl tartalmából ismeri fel; a fájlnév és a böngésző által küldött típus nem számít. Egy `.pdf`-re átnevezett szövegfájlt elutasít.
- **Méret:** fájlonként alapból 10 MiB (a core `PLUGIN_FILE_MAX_BYTES` változója). A `maxBytes` csak csökkentheti. A core `BODY_SIZE_LIMIT` értéke legalább ekkora legyen.
- **Tárolás:** a szerveren `uploads/plugin-files/{pluginId}/{év}/{hónap}/{fileId}`. Az eredeti név csak metaadat: a megjelenítéshez és a letöltési fejléchez kell.
- **Letöltési fejlécek:** `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, az eredeti név a `Content-Disposition`-ben (ékezetekkel együtt).

## Életciklus

- **A claim nélküli feltöltéseket** 24 óra után a `core.plugin-files-cleanup` core feladat törli (naponta 04:15-kor).
- **A saját rekord törlése** nem törli a fájlt: hívd meg a `context.files.delete(fileId)`-t.
- **A plugin eltávolításakor** a fájlok és a metaadataik (`platform.plugin_files`) megmaradnak, bár a plugin sémája törlődik. Egy adminisztrátor a `plugin_id` és a `ref` alapján azonosíthatja őket.
- **Mentés:** a fájlok a lemezen vannak, nem az adatbázisban. Az `uploads` mappának a mentés részének kell lennie.

## Biztonsági ellenőrzőlista

- **Minden** linket kérő, claimelő vagy törlő függvényben ellenőrizd a hívó jogait. A core csak azt ellenőrzi, hogy a link aláírt, nem járt le, és ugyanaz a felhasználó használja.
- Letöltési link előtt keresd meg a fájlazonosítót a saját tábládban; a kliens által küldött azonosítónak önmagában ne higgy.
- Az `allowedMimeTypes`-t szűkítsd arra, amire a funkciónak szüksége van.
- Ha a `claim` utáni adatbázis-beszúrás elbukik, töröld a fájlt.
