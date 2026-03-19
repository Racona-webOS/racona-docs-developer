---
title: Első alkalmazás létrehozása
description: Alkalmazás projekt létrehozása a create-elyos-app CLI tool segítségével – projekt struktúra, manifest, első build
---

## Előfeltételek

- [Bun](https://bun.sh) telepítve (`bun --version` ≥ 1.0)
- Futó ElyOS példány (Docker-rel vagy lokálisan) — szükséges az alkalmazás feltöltéséhez és az ElyOS rendszeren belüli teszteléséhez (nem csak standalone módban). Lásd: [Docker-alapú futtatás](/hu/getting-started#docker-alapú-futtatás)

## Projekt létrehozása

Az ElyOS-hoz elérhető CLI segítségével hozd létre az új alkalmazás projektet:

```bash
bunx @elyos-dev/create-app
```

Az interaktív wizard végigvezet a beállításokon:

1. **Alkalmazás ID** — kebab-case azonosító (pl. `my-app`)
2. **Megjelenítési név** — amit a felhasználók látnak
3. **Leírás** — rövid leírás
4. **Szerző** — `Név <email>` formátumban
5. **Template** — `basic`, `advanced`, vagy `datatable`
6. **Jogosultságok** — `database`, `notifications`, `remote_functions`

Vagy megadhatod a nevet és a template-et közvetlenül:

```bash
bunx @elyos-dev/create-app my-app --template basic
bunx @elyos-dev/create-app my-app --template advanced
bunx @elyos-dev/create-app my-app --template datatable --no-install
```

### Elérhető template-ek

| Template | Mire jó |
|---|---|
| `basic` | Egyszerű UI alkalmazás, nincs szerver oldali logika |
| `advanced` | Szerver függvényekkel, Settings komponenssel |
| `datatable` | CRUD alkalmazás DataTable-lel és szerver CRUD műveletekkel |
| `sidebar` | Oldalsávos navigációval rendelkező alkalmazás (AppLayout mód, `menu.json`) |

#### `basic` template

A `basic` template egy egyszerű, egyoldalas alkalmazást generál. Ideális kezdőknek és egyszerű alkalmazásokhoz.

A generált struktúra:

```
my-app/
├── manifest.json
├── src/
│   ├── App.svelte       # Fő komponens
│   └── main.ts          # Belépési pont
├── locales/
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

#### `advanced` template

Az `advanced` template szerver oldali logikát és egy Settings komponenst tartalmaz. Ideális olyan alkalmazásokhoz, amelyeknek szerver függvényekre van szükségük.

A generált struktúra:

```
my-app/
├── manifest.json
├── src/
│   ├── App.svelte       # Fő komponens
│   ├── main.ts          # Belépési pont
│   └── components/
│       └── Settings.svelte
├── server/
│   └── functions.ts     # Szerver oldali függvények
├── locales/
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

#### `datatable` template

A `datatable` template egy teljes CRUD alkalmazást generál DataTable komponenssel és szerver oldali CRUD műveletekkel. Ideális adatkezelő alkalmazásokhoz.

A generált struktúra:

```
my-app/
├── manifest.json
├── src/
│   ├── App.svelte       # Fő komponens
│   ├── main.ts          # Belépési pont
│   └── components/
│       ├── DataTable.svelte
│       └── Settings.svelte
├── server/
│   └── functions.ts     # CRUD szerver függvények
├── locales/
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

#### `sidebar` template

A `sidebar` template egy oldalsávos navigációs elrendezést generál, ahol az alkalmazás több oldalból áll. Az ElyOS az `AppLayout` komponensét használja a megjelenítéshez — az alkalmazás ablakának bal oldalán egy navigációs sáv jelenik meg, a jobb oldalon a kiválasztott oldal tartalma.

A generált struktúra:

```
my-app/
├── manifest.json
├── menu.json            # Oldalsáv navigáció definíciója
├── src/
│   ├── App.svelte       # Fő komponens (oldalsáv + routing)
│   └── components/
│       ├── Overview.svelte
│       └── Settings.svelte
├── locales/
│   ├── hu.json
│   └── en.json
└── migrations/          # Adatbázis migrációk (ha database permission van)
    └── 001_init.sql
```

A `menu.json` határozza meg az oldalsáv menüpontjait:

```json
[
  { "id": "overview", "labelKey": "menu.overview", "component": "Overview" },
  { "id": "settings", "labelKey": "menu.settings", "component": "Settings" }
]
```

A `labelKey` értékei namespace nélküliek — a rendszer automatikusan hozzáfűzi az `app:{id}.` prefixet a fordítások keresésekor.

## Projekt struktúra

A generált projekt struktúrája:

```
my-app/
├── manifest.json        # Alkalmazás metaadatok (kötelező)
├── package.json         # Függőségek és scriptek
├── vite.config.ts       # Build konfiguráció
├── tsconfig.json        # TypeScript konfiguráció
├── src/
│   ├── main.ts          # Belépési pont, Mock SDK init
│   ├── App.svelte       # Fő komponens
│   └── components/      # Alkomponensek (advanced/datatable template-ben)
├── server/              # Szerver oldali függvények (advanced/datatable)
│   └── functions.ts
├── locales/             # Fordítások
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg         # Alkalmazás ikon
```

:::note
Az `sdk-demo` példa alkalmazás megtalálható a monorepo-ban: `examples/apps/sdk-demo/`. Ez a legteljesebb referencia implementáció, érdemes átnézni fejlesztés előtt.
:::

## Kézi létrehozás (sdk-demo másolása)

Ha a monorepo-n belül dolgozol, másolhatod az sdk-demo példát:

```bash
cp -r examples/apps/sdk-demo examples/apps/my-app
cd examples/apps/my-app
# Módosítsd a manifest.json-t (id, name, description)
bun install
```

## Függőségek telepítése

```bash
cd my-app
bun install
```

A `@elyos/sdk` csomag elérhető az npm registry-ben és a JSR-en is — tartalmazza a TypeScript típusdefiníciókat és a fejlesztői Mock SDK-t.

## Első build

```bash
bun run build
```

Ez létrehozza a `dist/index.iife.js` fájlt — ez az ElyOS által betöltött bundle.

## Következő lépések

- [Fejlesztői workflow](/hu/plugins-development/) — standalone dev mód és Mock SDK
- [manifest.json referencia](/hu/plugins-manifest/) — minden mező részletesen
- [Build és feltöltés](/hu/plugins-build/) — `.elyospkg` csomag és telepítés
