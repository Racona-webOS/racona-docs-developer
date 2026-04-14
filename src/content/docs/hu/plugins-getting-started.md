---
title: Első alkalmazás létrehozása
description: Alkalmazás projekt létrehozása a @racona/cli CLI tool segítségével – projekt struktúra, manifest, első build
---

## Előfeltételek

- [Bun](https://bun.sh) telepítve (`bun --version` ≥ 1.0)
- Futó Racona példány (Docker-rel vagy lokálisan) — szükséges az alkalmazás feltöltéséhez és a Rocona rendszeren belüli teszteléséhez (nem csak standalone módban). Lásd: [Docker-alapú futtatás](/hu/getting-started#docker-alapú-futtatás)

## Projekt létrehozása

A Rocona-hoz elérhető CLI segítségével hozd létre az új alkalmazás projektet:

```bash
bunx @racona/cli
```

Az interaktív wizard végigvezet a beállításokon:

1. **Alkalmazás ID** — kebab-case azonosító (pl. `my-app`)
2. **Megjelenítési név** — amit a felhasználók látnak
3. **Leírás** — rövid leírás
4. **Szerző** — `Név <email>` formátumban
5. **Funkciók** — válaszd ki, mire van szükséged (lásd lent)
6. **Függőségek telepítése?** — automatikusan futtatja a `bun install`-t

### Funkció választó

Fix template-ek helyett a CLI lehetővé teszi, hogy egyedi funkciókból rakd össze a projektedet:

| Funkció | Mit ad hozzá |
|---|---|
| `sidebar` | Oldalsáv navigáció (`menu.json`, `AppLayout` mód, több oldal komponens) |
| `database` | SQL migrációk, `sdk.data.query()` támogatás, lokális dev adatbázis Docker-rel |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, lokális dev szerver |
| `notifications` | `sdk.notifications.send()` támogatás |
| `i18n` | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` támogatás |
| `datatable` | DataTable komponens insert formmal, sor akciókkal, teljes i18n |

:::note
A `database` megköveteli a `remote_functions` funkciót — ha `database`-t választasz, a `remote_functions` automatikusan bekapcsol.
:::

## Generált projekt struktúra

A struktúra a kiválasztott funkcióktól függ. Példa minden funkcióval engedélyezve:

```
my-app/
├── manifest.json          # Alkalmazás metaadatok és jogosultságok (kötelező)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (ha sidebar)
├── build-all.js           # (ha sidebar) fő + összes komponens buildelése
├── dev-server.ts          # (ha remote_functions) lokális dev szerver
├── docker-compose.dev.yml # (ha database) lokális Postgres
├── .env.example           # (ha database)
├── src/
│   ├── App.svelte         # Fő komponens / sidebar shell
│   ├── main.ts            # Belépési pont, Mock SDK init
│   ├── plugin.ts          # IIFE build belépési pont
│   └── components/        # (ha sidebar)
│       ├── Overview.svelte
│       ├── Settings.svelte
│       ├── Datatable.svelte     # (ha datatable)
│       ├── Notifications.svelte # (ha notifications)
│       └── Remote.svelte        # (ha remote_functions)
├── server/                # (ha remote_functions)
│   └── functions.ts
├── migrations/            # (ha database)
│   ├── 001_init.sql
│   └── dev/
│       └── 000_auth_seed.sql
├── locales/               # (ha i18n)
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

## Datatable funkció

Ha a `datatable` + `database` + `remote_functions` mind be van kapcsolva, a generált `Datatable.svelte` tartalmazza:

- Adattáblát `sdk.data.query()` hívással töltve
- **Beszúró űrlapot** a táblázat alatt (`name` + `value` mezők), core CSS változókkal stílusozva
- **Sor akciókat**: Duplikálás (elsődleges) és Törlés (másodlagos, destructive) — törlés `sdk.ui.dialog()` megerősítő modallal
- Teljes i18n támogatást — minden szöveg `t()` hívással, fordítási kulcsok a `locales/` mappában

A generált `server/functions.ts` exportálja:

```ts
export async function example(params, context) { ... }
export async function insertItem(params, context) { ... }
export async function deleteItem(params, context) { ... }
export async function duplicateItem(params, context) { ... }
```

Minden függvény az alkalmazás saját `app__<id>` adatbázis sémájára van korlátozva a `context.pluginId` alapján.

## Sidebar funkció

Ha a `sidebar` be van kapcsolva, az alkalmazás `AppLayout` módban fut — a Rocona navigációs sávot jelenít meg az alkalmazás ablakának bal oldalán. A `menu.json` határozza meg a navigációs elemeket:

```json
[
  { "labelKey": "menu.overview", "href": "#overview", "icon": "Info", "component": "Overview" },
  { "labelKey": "menu.settings", "href": "#settings", "icon": "Settings", "component": "Settings" }
]
```

Minden `component` érték a `src/components/` mappában lévő fájlra mutat.

## Database funkció

Ha a `database` be van kapcsolva, a projekt tartalmazza:

- `migrations/001_init.sql` — kezdeti séma (a táblaneveket a Rocona installer automatikusan prefixeli `app__<id>`-vel)
- `migrations/dev/000_auth_seed.sql` — minimális `auth` séma lokális fejlesztéshez
- `docker-compose.dev.yml` — lokális Postgres konténer
- `.env.example` — `DATABASE_URL` és `PORT` konfiguráció

Lokális fejlesztési workflow:

```bash
cp .env.example .env
bun db:up          # Lokális Postgres indítása
bun dev:server     # Dev szerver indítása (automatikusan futtatja a migrációkat)
bun dev            # Vite dev szerver indítása (külön terminálban)
```

Vagy egy lépésben:

```bash
bun dev:full       # dev:server + dev párhuzamosan
```

## Függőségek telepítése

```bash
cd my-app
bun install
```

## Első build

```bash
bun run build
```

Ez létrehozza a `dist/index.iife.js` fájlt (és a komponens bundle-öket, ha sidebar engedélyezve van) — ezeket tölti be a Rocona.

## Következő lépések

- [Fejlesztői workflow](/hu/plugins-development/) — standalone dev mód és Mock SDK
- [manifest.json referencia](/hu/plugins-manifest/) — minden mező részletesen
- [Build és feltöltés](/hu/plugins-build/) — `.elyospkg` csomag és telepítés
