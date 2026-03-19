---
title: manifest.json referencia
description: Az alkalmazás manifest.json fájl összes mezőjének részletes dokumentációja – kötelező és opcionális mezők, típusok, példák
---

A `manifest.json` az alkalmazás "útlevele" — az ElyOS ebből tudja meg, hogyan kell betölteni és megjeleníteni az alkalmazást.

## Teljes példa

```json
{
  "id": "my-app",
  "name": {
    "hu": "Saját Alkalmazás",
    "en": "My App"
  },
  "description": {
    "hu": "Alkalmazás leírása magyarul",
    "en": "App description in English"
  },
  "version": "1.0.0",
  "author": "Fejlesztő Neve <email@example.com>",
  "entry": "dist/index.iife.js",
  "icon": "icon.svg",
  "iconStyle": "cover",
  "category": "utilities",
  "permissions": ["database", "notifications", "remote_functions"],
  "multiInstance": false,
  "defaultSize": { "width": 800, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "maxSize": { "width": 1920, "height": 1080 },
  "keywords": ["example", "demo"],
  "isPublic": true,
  "sortOrder": 100,
  "dependencies": {
    "svelte": "^5.0.0",
    "@lucide/svelte": "^0.561.0"
  },
  "minWebOSVersion": "2.0.0",
  "locales": ["hu", "en"]
}
```

## Kötelező mezők

### `id`

**Típus:** `string`

Az alkalmazás egyedi azonosítója. Csak kisbetűket, számokat és kötőjelet tartalmazhat (kebab-case).

```json
"id": "my-awesome-app"
```

:::caution
Az ID-t telepítés után **nem lehet megváltoztatni** — ez azonosítja az alkalmazást az adatbázisban és a fájlrendszerben. Válassz gondosan.
:::

Érvényes formátum: `^[a-z][a-z0-9-]*$`, minimum 2, maximum 50 karakter.

### `name`

**Típus:** `{ hu: string, en: string }` vagy `string`

Az alkalmazás megjelenítendő neve a Start Menüben és az Alkalmazás Managerben.

```json
"name": { "hu": "Saját Alkalmazás", "en": "My App" }
```

### `description`

**Típus:** `{ hu: string, en: string }` vagy `string`

Rövid leírás, megjelenik az Alkalmazás Managerben.

### `version`

**Típus:** `string` — szemantikus verzió (`MAJOR.MINOR.PATCH`)

```json
"version": "1.0.0"
```

### `author`

**Típus:** `string` — `Név <email>` formátumban

```json
"author": "Kovács János <janos@example.com>"
```

### `entry`

**Típus:** `string`

A build output belépési pontja. **Ne változtasd meg** — mindig `"dist/index.iife.js"`.

### `icon`

**Típus:** `string`

Az ikon fájl neve az `assets/` mappán belül. SVG formátum ajánlott.

```json
"icon": "icon.svg"
```

### `permissions`

**Típus:** `string[]`

Az alkalmazás által igényelt jogosultságok listája. Csak a valóban szükséges jogosultságokat add meg.

```json
"permissions": ["database", "remote_functions"]
```

Elérhető jogosultságok: lásd [Biztonság és jogosultságok](/hu/apps-security/).

## Opcionális mezők

### `iconStyle`

**Típus:** `"cover"` | `"contain"` | `"auto"`
**Alapértelmezett:** `"auto"`

Az ikon megjelenítési módja a Start Menüben és a Taskbarban.

### `category`

**Típus:** `string`
**Alapértelmezett:** `"utilities"`

Az alkalmazás kategóriája a Start Menüben való csoportosításhoz. Pl.: `"utilities"`, `"productivity"`, `"communication"`.

### `multiInstance`

**Típus:** `boolean`
**Alapértelmezett:** `false`

Ha `true`, a felhasználó egyszerre több ablakban is megnyithatja az alkalmazást.

### `defaultSize`

**Típus:** `{ width: number, height: number }`
**Alapértelmezett:** `{ width: 800, height: 600 }`

Az ablak alapértelmezett mérete pixelben.

### `minSize` / `maxSize`

**Típus:** `{ width: number, height: number }`

Az ablak minimális és maximális mérete. Ha nincs megadva, nincs korlát.

### `keywords`

**Típus:** `string[]`

Keresési kulcsszavak az Alkalmazás Managerhez.

### `isPublic`

**Típus:** `boolean`
**Alapértelmezett:** `true`

Ha `false`, az alkalmazás nem jelenik meg a Start Menüben — csak programatikusan nyitható meg.

### `sortOrder`

**Típus:** `number`
**Alapértelmezett:** `100`

A Start Menüben való rendezési sorrend. Kisebb szám = előrébb jelenik meg.

### `dependencies`

**Típus:** `Record<string, string>`

Az alkalmazás által használt külső függőségek. Csak a [fehérlistán](/hu/apps-security/#engedélyezett-függőségek) lévő csomagok engedélyezettek.

```json
"dependencies": {
  "svelte": "^5.0.0",
  "@lucide/svelte": "^0.561.0"
}
```

### `minWebOSVersion`

**Típus:** `string`

A minimálisan szükséges ElyOS verzió. Ha az ElyOS régebbi, az alkalmazás nem telepíthető.

### `locales`

**Típus:** `string[]`

Az alkalmazás által támogatott nyelvek ISO kódjai.

```json
"locales": ["hu", "en"]
```

## Verziókezelés

A `version` mező szemantikus verziózást követ:

| Változás | Verzió bump |
|---|---|
| Bug fix | `1.0.0` → `1.0.1` |
| Új funkció (visszafelé kompatibilis) | `1.0.1` → `1.1.0` |
| Breaking change | `1.1.0` → `2.0.0` |
