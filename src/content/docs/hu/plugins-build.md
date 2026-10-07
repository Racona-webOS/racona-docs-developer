---
title: Build és csomagolás
description: Alkalmazás build folyamat, .raconapkg formátum és feltöltés
---

## Build folyamat

Az alkalmazás fejlesztése során két fő build lépés van: a standalone fejlesztői mód és a produkciós build.

### Standalone fejlesztői mód

```bash
bun run dev
```

Elindít egy Vite dev szervert (`http://localhost:5174`), amely az `index.html` → `src/main.ts` belépési ponton keresztül közvetlenül mountolja az `App.svelte`-t. A Mock SDK-val együtt használva teljes fejlesztői élményt nyújt böngészőben, hot reload-dal.

Ez a mód **nem** az IIFE bundle-t futtatja — az alkalmazás itt normál Svelte alkalmazásként fut, nem Web Component-ként.

### Produkciós build (Racona-be töltéshez)

```bash
bun run build
```

Lefordítja az alkalmazást IIFE formátumba a `dist/` mappába. A Vite a `src/app.ts` belépési pontot használja, amely Web Component-ként exportálja az alkalmazást. Ezt a bundle-t tölti be a Racona.

A build eredménye:

```
dist/
└── index.iife.js    # IIFE bundle — ezt tölti be a Racona
```

### Statikus dev szerver (Racona-ben való teszteléshez)

```bash
bun run dev:server
```

Elindítja a `dev-server.ts` Bun HTTP szervert a `http://localhost:5174` címen. A szerver a `dist/` mappából és a projekt gyökeréből szolgálja ki a fájlokat CORS fejlécekkel — a Racona innen fetch-eli a `manifest.json`-t és az IIFE bundle-t.

:::note
A `dev:server` futtatása előtt mindig futtasd a `bun run build`-ot, hogy a `dist/index.iife.js` naprakész legyen.
:::

### menu.json-os alkalmazás build

Ha az alkalmazás `menu.json`-t tartalmaz (AppLayout mód), a fő komponens mellett az összes oldal-komponenst is le kell buildelni. Erre való a `build-all.js` script:

```bash
bun run build:all
```

Ez a script:
1. Lebuildeli a fő alkalmazást (`BUILD_MODE=main`)
2. Végigmegy a `src/components/` mappán
3. Minden `.svelte` fájlt külön buildel (`BUILD_MODE=components`)

```js
// build-all.js (részlet)
execSync('BUILD_MODE=main vite build', { stdio: 'inherit' });

for (const file of svelteFiles) {
  execSync(`BUILD_MODE=components COMPONENT_FILE=${file} vite build`, {
    stdio: 'inherit'
  });
}
```

A `vite.config.js`-ben a `BUILD_MODE` env változó határozza meg, hogy éppen melyik entry point-ot kell buildelni.

---

## Csomagolás (.raconapkg)

A build után az alkalmazást egyetlen `.raconapkg` fájlba kell csomagolni:

```bash
bun run package
```

Ez a projekt gyökerében lévő `build-package.js` scriptet futtatja, amely:
1. Beolvassa a `manifest.json`-t az `id` és `version` mezők alapján
2. Összegyűjti a `manifest.json`-t, a `dist/` mappát, valamint — ha léteznek — a `locales/`, `assets/`, `server/`, `migrations/`, `email-templates/`, `knowledge-base/` és `help/` mappákat és a `menu.json`-t
3. Egy ZIP archívumba tömöríti őket
4. `.raconapkg` kiterjesztéssel menti el a projekt gyökerébe

A csomag neve a `manifest.json`-ban lévő `id` és `version` mezőkből áll össze:

```
{app-id}-{version}.raconapkg
```

Például: `hello-world-1.0.0.raconapkg`

:::note
A `bun run package` futtatása előtt mindig futtasd a `bun run build`-ot. A script az `adm-zip` csomaggal tömörít, nem függ rendszerparancstól.

A kiterjesztés a `build-package.js`-ben fixen `.raconapkg`. A Racona szerver a `PLUGIN_PACKAGE_EXTENSION` környezeti változóban megadott kiterjesztést fogadja el (alapértelmezett: `raconapkg`) — ha a szervered mást használ, a `build-package.js`-ben írd át az `outputName` kiterjesztését ugyanarra.
:::

### A csomag tartalma

```
hello-world-1.0.0.raconapkg  (ZIP archívum)
├── manifest.json
├── dist/
│   └── index.iife.js
├── locales/
│   ├── hu.json
│   └── en.json
├── assets/
│   └── icon.svg
├── migrations/          # opcionális — csak ha van migrations/ mappa
│   └── 001_init.sql
├── email-templates/     # opcionális — csak ha van email-templates/ mappa
│   └── welcome.json
├── knowledge-base/      # opcionális — az AI asszisztens dokumentációja
├── help/                # opcionális — felhasználói útmutató a Súgó alkalmazásban
│   └── hu/_overview.md
└── server/              # opcionális — csak ha van server/ mappa
    ├── functions.ts
    └── jobs.ts          # ütemezett feladatok (ha vannak)
```

A `build-package.js` automatikusan csak azokat a mappákat/fájlokat csomagolja be, amelyek ténylegesen léteznek — a `migrations/` és `server/` mappák hiánya nem okoz hibát. A `migrations/dev/` almappa (fejlesztői seed) nem kerül a csomagba.

:::note[A `server/` mappát nem kell fordítani]
A core a plugin gyökerében lévő `server/functions.{js,ts}` és `server/jobs.{js,ts}` modult tölti be (ha mindkettő létezik, a `.js`-t), és a Bun natívan futtatja a TypeScriptet. A csomagba ezért a forrás kerül, `dist/server`-be fordított kódot a core nem tölt be.
:::

---

## Feltöltés

### Alkalmazás Manager UI-n keresztül (ajánlott)

1. Nyisd meg a Racona-t böngészőben
2. Kattints a Start menüre → Alkalmazás Manager
3. Kattints a "Alkalmazás feltöltése" gombra
4. Válaszd ki a `.raconapkg` fájlt
5. Erősítsd meg a telepítést

:::note
Az Alkalmazás Manager csak admin jogosultsággal érhető el.
:::

### API-n keresztül

A `/api/plugins/upload` endpoint **session cookie alapú autentikációt** használ (`better-auth`) — Bearer token nem támogatott. Ez azt jelenti, hogy az API-t csak bejelentkezett böngészőből, vagy a session cookie-t tartalmazó HTTP kliensből lehet hívni.

Feltöltés `curl`-lel (a böngészőből kimásolt session cookie-val):

```bash
curl -X POST https://your-racona-instance.com/api/plugins/upload \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -F "file=@hello-world-1.0.0.raconapkg"
```

A session token a böngésző DevTools → Application → Cookies → `better-auth.session_token` mezőből másolható ki (bejelentkezett állapotban).

:::caution
A session token rövid életű és felhasználóhoz kötött. Automatizált CI/CD pipeline-hoz jelenleg nincs dedikált API token támogatás — ilyen esetben az Alkalmazás Manager UI-t használd.
:::

### Frissítés

Meglévő alkalmazás frissítésekor növeld a `manifest.json`-ban a verziószámot, majd töltsd fel az új csomagot. A Racona automatikusan felismeri, hogy frissítésről van szó.

---

## Teljes build workflow

```bash
# 1. Standalone fejlesztés (Vite dev szerver, Mock SDK, hot reload)
bun run dev

# 2. Racona-ben való tesztelés
bun run build       # IIFE bundle elkészítése
bun run dev:server  # statikus szerver indítása (http://localhost:5174)
# Racona: Alkalmazás Manager → Dev Alkalmazások → Load → http://localhost:5174

# 3. Produkciós csomagolás
bun run build
bun run package     # .raconapkg fájl létrehozása

# 4. Feltöltés (Alkalmazás Manager UI-n keresztül ajánlott)
# Vagy curl-lel, session cookie-val:
curl -X POST .../api/plugins/upload \
  -H "Cookie: better-auth.session_token=<token>" \
  -F "file=@my-app-1.0.0.raconapkg"
```
