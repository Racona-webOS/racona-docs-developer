---
title: Első plugin létrehozása
description: Plugin projekt létrehozása a create-elyos-app CLI tool segítségével – projekt struktúra, manifest, első build
---

## Előfeltételek

- [Bun](https://bun.sh) telepítve (`bun --version` ≥ 1.0)
- Futó ElyOS példány (Docker-rel vagy lokálisan) a feltöltéshez

## Projekt létrehozása

### Ha a `create-elyos-app` elérhető npm-en

Ha a csomag már publikálva van az npm registry-be, a `bunx` automatikusan letölti és futtatja:

```bash
bunx @elyos-dev/create-app
```

### Ha még nincs publikálva (lokális használat)

Jelenleg a CLI a monorepo része, ezért lokálisan kell buildelni és futtatni:

```bash
# A monorepo packages/create-elyos-app mappájában:
bun run build   # lefordítja a CLI-t a dist/ mappába
bun link        # globálisan elérhetővé teszi a gépeden
```

Ezután bárhonnan futtatható:

```bash
create-elyos-app
```

:::note
Ha nem férsz hozzá a monorepo-hoz, a [kézi létrehozás](#kézi-létrehozás-hello-world-másolása) (hello-world másolása) az ajánlott módszer.
:::

Az interaktív wizard végigvezet a beállításokon:

Az interaktív wizard végigvezet a beállításokon:

1. **Plugin ID** — kebab-case azonosító (pl. `my-plugin`)
2. **Megjelenítési név** — amit a felhasználók látnak
3. **Leírás** — rövid leírás
4. **Szerző** — `Név <email>` formátumban
5. **Template** — `basic`, `advanced`, vagy `datatable`
6. **Jogosultságok** — `database`, `notifications`, `remote_functions`

Vagy megadhatod a nevet és a template-et közvetlenül:

```bash
bunx @elyos-dev/create-app my-plugin --template basic
bunx @elyos-dev/create-app my-plugin --template advanced
bunx @elyos-dev/create-app my-plugin --template datatable --no-install
```

### Elérhető template-ek

| Template | Mire jó |
|---|---|
| `basic` | Egyszerű UI plugin, nincs szerver oldali logika |
| `advanced` | Szerver függvényekkel, Settings komponenssel |
| `datatable` | CRUD alkalmazás DataTable-lel és szerver CRUD műveletekkel |
| `sidebar` | Oldalsávos navigációval rendelkező plugin (AppLayout mód, `menu.json`) |

#### `sidebar` template

A `sidebar` template egy oldalsávos navigációs elrendezést generál, ahol a plugin több oldalból áll. Az ElyOS az `AppLayout` komponensét használja a megjelenítéshez — a plugin ablakának bal oldalán egy navigációs sáv jelenik meg, a jobb oldalon a kiválasztott oldal tartalma.

A generált struktúra:

```
my-plugin/
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

A `labelKey` értékei namespace nélküliek — a rendszer automatikusan hozzáfűzi a `plugin:{id}.` prefixet a fordítások keresésekor.

## Projekt struktúra

A generált projekt struktúrája:

```
my-plugin/
├── manifest.json        # Plugin metaadatok (kötelező)
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
    └── icon.svg         # Plugin ikon
```

:::note
A `hello-world` példa plugin megtalálható a monorepo-ban: `examples/plugins/hello-world/`. Ez a legteljesebb referencia implementáció, érdemes átnézni fejlesztés előtt.
:::

## Kézi létrehozás (hello-world másolása)

Ha a monorepo-n belül dolgozol, másolhatod a hello-world példát:

```bash
cp -r examples/plugins/hello-world examples/plugins/my-plugin
cd examples/plugins/my-plugin
# Módosítsd a manifest.json-t (id, name, description)
bun install
```

## Függőségek telepítése

```bash
cd my-plugin
bun install
```

A `@elyos/sdk` csomag tartalmazza a TypeScript típusdefiníciókat és a fejlesztői Mock SDK-t.

:::caution[@elyos/sdk nincs npm-en — átmeneti megoldás]
Jelenleg a `@elyos/sdk` csomag nincs publikálva az npm registry-be, ezért a `bun install` 404-es hibával meghiúsul. Ha az SDK már elérhető npm-en, ez a szekció kihagyható — a generált `package.json` `"^1.0.0"` verziója automatikusan működni fog.
:::

### @elyos/sdk lokális hivatkozás (amíg nincs npm-en)

A generált `package.json`-ban cseréld le az `@elyos/sdk` verzióját `link:` prefixre, amely a monorepo SDK mappájára mutat:

```json
// package.json
{
  "dependencies": {
    "@elyos/sdk": "file:../../elyos-core/packages/sdk"
  }
}
```

Az útvonal relatív a plugin projekt mappájához képest — igazítsd a saját könyvtárstruktúrádhoz. Például ha a plugin az `elyos-plugins/my-plugin/` mappában van, és az SDK az `elyos-core/packages/sdk/` alatt, akkor `../../elyos-core/packages/sdk` a helyes útvonal. A `file:` protokoll közvetlenül a megadott mappából veszi a csomagot, nem kell hozzá globális `bun link`.

Ezután a `bun install` már nem az npm-ről próbálja letölteni:

```bash
bun install
```

:::note
A `link:` protokoll bunnál a globális link registry-t keresi, nem relatív fájlrendszer-útvonalat — ezért `file:` kell helyette. A `bun link` + `bun link @elyos/sdk` kombináció sem elegendő, mert a `bun install` futásakor a `package.json`-ban lévő verzió alapján az npm registry-t kérdezi le.
:::

Ha az SDK forrása változott, újra kell buildelni:

```bash
# elyos-core/packages/sdk mappában:
bun run build
```

## Első build

```bash
bun run build
```

Ez létrehozza a `dist/index.iife.js` fájlt — ez az ElyOS által betöltött bundle.

## Következő lépések

- [Fejlesztői workflow](/hu/plugins-development/) — standalone dev mód és Mock SDK
- [manifest.json referencia](/hu/plugins-manifest/) — minden mező részletesen
- [Build és feltöltés](/hu/plugins-build/) — `.elyospkg` csomag és telepítés
