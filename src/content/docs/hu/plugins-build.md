---
title: Build és csomagolás
description: Alkalmazás build folyamat, .elyospkg formátum és feltöltés
---

## Build folyamat

Az alkalmazás fejlesztése során két fő build lépés van: a standalone fejlesztői mód és a produkciós build.

### Standalone fejlesztői mód

```bash
bun run dev
```

Elindít egy Vite dev szervert (`http://localhost:5174`), amely az `index.html` → `src/main.ts` belépési ponton keresztül közvetlenül mountolja az `App.svelte`-t. A Mock SDK-val együtt használva teljes fejlesztői élményt nyújt böngészőben, hot reload-dal.

Ez a mód **nem** az IIFE bundle-t futtatja — az alkalmazás itt normál Svelte alkalmazásként fut, nem Web Component-ként.

### Produkciós build (ElyOS-be töltéshez)

```bash
bun run build
```

Lefordítja az alkalmazást IIFE formátumba a `dist/` mappába. A Vite a `src/app.ts` belépési pontot használja, amely Web Component-ként exportálja az alkalmazást. Ezt a bundle-t tölti be az ElyOS.

A build eredménye:

```
dist/
└── index.iife.js    # IIFE bundle — ezt tölti be az ElyOS
```

### Statikus dev szerver (ElyOS-ben való teszteléshez)

```bash
bun run dev:server
```

Elindítja a `dev-server.ts` Bun HTTP szervert a `http://localhost:5174` címen. A szerver a `dist/` mappából és a projekt gyökeréből szolgálja ki a fájlokat CORS fejlécekkel — az ElyOS innen fetch-eli a `manifest.json`-t és az IIFE bundle-t.

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

## Csomagolás (.elyospkg)

A build után az alkalmazást egyetlen `.elyospkg` fájlba kell csomagolni:

```bash
bun run package
```

Ez a projekt gyökerében lévő `build-package.js` scriptet futtatja, amely:
1. Beolvassa a `manifest.json`-t az `id` és `version` mezők alapján
2. Összegyűjti a `dist/`, `locales/`, `assets/` mappákat és a `manifest.json`-t
3. Egy ZIP archívumba tömöríti őket
4. `.elyospkg` kiterjesztéssel menti el a projekt gyökerébe

A csomag neve a `manifest.json`-ban lévő `id` és `version` mezőkből áll össze:

```
{app-id}-{version}.elyospkg
```

Például: `hello-world-1.0.0.elyospkg`

:::note
A `bun run package` futtatása előtt mindig futtasd a `bun run build`-ot. A script a `zip` rendszerparancsot használja (macOS és Linux rendszereken alapból elérhető).

A generált fájl kiterjesztése a `APP_PACKAGE_EXTENSION` környezeti változóból jön (alapértelmezett: `elyospkg`). Ha az ElyOS szervered más kiterjesztéssel van konfigurálva, add meg a változót a csomagolás előtt:

```bash
APP_PACKAGE_EXTENSION=wospkg bun run package
```
:::

### A csomag tartalma

```
hello-world-1.0.0.elyospkg  (ZIP archívum)
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
└── server/              # opcionális — csak ha van server/ mappa
    └── functions.js
```

A `build-package.js` automatikusan csak azokat a mappákat/fájlokat csomagolja be, amelyek ténylegesen léteznek — a `migrations/` és `server/` mappák hiánya nem okoz hibát.

---

## Feltöltés

### Alkalmazás Manager UI-n keresztül (ajánlott)

1. Nyisd meg az ElyOS-t böngészőben
2. Kattints a Start menüre → Alkalmazás Manager
3. Kattints a "Alkalmazás feltöltése" gombra
4. Válaszd ki a `.elyospkg` fájlt
5. Erősítsd meg a telepítést

:::note
Az Alkalmazás Manager csak admin jogosultsággal érhető el.
:::

### API-n keresztül

A `/api/apps/upload` endpoint **session cookie alapú autentikációt** használ (`better-auth`) — Bearer token nem támogatott. Ez azt jelenti, hogy az API-t csak bejelentkezett böngészőből, vagy a session cookie-t tartalmazó HTTP kliensből lehet hívni.

Feltöltés `curl`-lel (a böngészőből kimásolt session cookie-val):

```bash
curl -X POST https://your-elyos-instance.com/api/apps/upload \
  -H "Cookie: better-auth.session_token=<session_token>" \
  -F "file=@hello-world-1.0.0.elyospkg"
```

A session token a böngésző DevTools → Application → Cookies → `better-auth.session_token` mezőből másolható ki (bejelentkezett állapotban).

:::caution
A session token rövid életű és felhasználóhoz kötött. Automatizált CI/CD pipeline-hoz jelenleg nincs dedikált API token támogatás — ilyen esetben az Alkalmazás Manager UI-t használd.
:::

### Frissítés

Meglévő alkalmazás frissítésekor növeld a `manifest.json`-ban a verziószámot, majd töltsd fel az új csomagot. Az ElyOS automatikusan felismeri, hogy frissítésről van szó.

---

## Teljes build workflow

```bash
# 1. Standalone fejlesztés (Vite dev szerver, Mock SDK, hot reload)
bun run dev

# 2. ElyOS-ben való tesztelés
bun run build       # IIFE bundle elkészítése
bun run dev:server  # statikus szerver indítása (http://localhost:5174)
# ElyOS: Alkalmazás Manager → Dev Alkalmazások → Load → http://localhost:5174

# 3. Produkciós csomagolás
bun run build
bun run package     # .elyospkg fájl létrehozása

# 4. Feltöltés (Alkalmazás Manager UI-n keresztül ajánlott)
# Vagy curl-lel, session cookie-val:
curl -X POST .../api/apps/upload \
  -H "Cookie: better-auth.session_token=<token>" \
  -F "file=@my-app-1.0.0.elyospkg"
```
