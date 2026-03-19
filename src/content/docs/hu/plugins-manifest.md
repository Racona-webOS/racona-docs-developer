---
title: manifest.json referencia
description: A plugin manifest.json fájl összes mezőjének részletes dokumentációja – kötelező és opcionális mezők, típusok, példák
---

A `manifest.json` a plugin "útlevele" — az ElyOS ebből tudja meg, hogyan kell betölteni és megjeleníteni a plugint.

## Teljes példa

```json
{
  "id": "my-plugin",
  "name": {
    "hu": "Saját Plugin",
    "en": "My Plugin"
  },
  "description": {
    "hu": "Plugin leírása magyarul",
    "en": "Plugin description in English"
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

A plugin egyedi azonosítója. Csak kisbetűket, számokat és kötőjelet tartalmazhat (kebab-case).

```json
"id": "my-awesome-plugin"
```

:::caution
Az ID-t telepítés után **nem lehet megváltoztatni** — ez azonosítja a plugint az adatbázisban és a fájlrendszerben. Válassz gondosan.
:::

Érvényes formátum: `^[a-z][a-z0-9-]*$`, minimum 2, maximum 50 karakter.

### `name`

**Típus:** `{ hu: string, en: string }` vagy `string`

A plugin megjelenítendő neve a Start Menüben és a Plugin Managerben.

```json
"name": { "hu": "Saját Plugin", "en": "My Plugin" }
```

### `description`

**Típus:** `{ hu: string, en: string }` vagy `string`

Rövid leírás, megjelenik a Plugin Managerben.

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

A plugin által igényelt jogosultságok listája. Csak a valóban szükséges jogosultságokat add meg.

```json
"permissions": ["database", "remote_functions"]
```

Elérhető jogosultságok: lásd [Biztonság és jogosultságok](/hu/plugins-security/).

## Opcionális mezők

### `iconStyle`

**Típus:** `"cover"` | `"contain"` | `"auto"`
**Alapértelmezett:** `"auto"`

Az ikon megjelenítési módja a Start Menüben és a Taskbarban.

### `category`

**Típus:** `string`
**Alapértelmezett:** `"utilities"`

A plugin kategóriája a Start Menüben való csoportosításhoz. Pl.: `"utilities"`, `"productivity"`, `"communication"`.

### `multiInstance`

**Típus:** `boolean`
**Alapértelmezett:** `false`

Ha `true`, a felhasználó egyszerre több ablakban is megnyithatja a plugint.

### `defaultSize`

**Típus:** `{ width: number, height: number }`
**Alapértelmezett:** `{ width: 800, height: 600 }`

Az ablak alapértelmezett mérete pixelben.

### `minSize` / `maxSize`

**Típus:** `{ width: number, height: number }`

Az ablak minimális és maximális mérete. Ha nincs megadva, nincs korlát.

### `keywords`

**Típus:** `string[]`

Keresési kulcsszavak a Plugin Managerhez.

### `isPublic`

**Típus:** `boolean`
**Alapértelmezett:** `true`

Ha `false`, a plugin nem jelenik meg a Start Menüben — csak programatikusan nyitható meg.

### `sortOrder`

**Típus:** `number`
**Alapértelmezett:** `100`

A Start Menüben való rendezési sorrend. Kisebb szám = előrébb jelenik meg.

### `dependencies`

**Típus:** `Record<string, string>`

A plugin által használt külső függőségek. Csak a [fehérlistán](/hu/plugins-security/#engedélyezett-függőségek) lévő csomagok engedélyezettek.

```json
"dependencies": {
  "svelte": "^5.0.0",
  "@lucide/svelte": "^0.561.0"
}
```

### `minWebOSVersion`

**Típus:** `string`

A minimálisan szükséges ElyOS verzió. Ha az ElyOS régebbi, a plugin nem telepíthető.

### `locales`

**Típus:** `string[]`

A plugin által támogatott nyelvek ISO kódjai.

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
