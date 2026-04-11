---
title: Plugin fejlesztés
description: ElyOS plugin fejlesztés – projekt létrehozás, standalone fejlesztés Mock SDK-val, tesztelés futó ElyOS-ben, telepítés
---

## Projekt létrehozása

A leggyorsabb módja egy új plugin projekt indításának a `@elyos-dev/create-app` CLI:

```bash
bunx @elyos-dev/create-app
```

A wizard végigvezet a beállításokon:

1. **App ID** — kebab-case azonosító (pl. `my-app`)
2. **Display Name** — megjelenítendő név az ElyOS-ben
3. **Description** — rövid leírás
4. **Author** — neved és email-ed
5. **Features** — válaszd ki a szükséges funkciókat
6. **Install dependencies?** — automatikusan futtatja a `bun install`-t

### Elérhető feature-ök

| Feature | Mit ad hozzá |
|---|---|
| `sidebar` | Oldalsáv navigáció (`menu.json`, `AppLayout` mód, több oldal komponens) |
| `database` | SQL migrációk, `sdk.data.query()` támogatás, lokális dev adatbázis Docker-rel |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, lokális dev szerver |
| `notifications` | `sdk.notifications.send()` támogatás |
| `i18n` | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` támogatás |
| `datatable` | DataTable komponens insert formmal, sor akciókkal (duplikálás/törlés), teljes i18n |

:::note
A `database` feature automatikusan engedélyezi a `remote_functions`-t is, mivel az adatbázis hozzáférés szerver oldali függvényeken keresztül történik.
:::

### Generált projekt struktúra

A struktúra a kiválasztott feature-öktől függ. Teljes példa (minden feature engedélyezve):

```
my-app/
├── manifest.json          # App metaadatok és jogosultságok
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (ha sidebar)
├── build-all.js           # (ha sidebar)
├── dev-server.ts          # (ha remote_functions)
├── docker-compose.dev.yml # (ha database)
├── .env.example           # (ha database)
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── plugin.ts
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

---

## Fejlesztői workflow

A generált projekt scriptkészlete a kiválasztott feature-öktől függ.

### Alap scriptek (minden projektnél)

```bash
bun dev            # Vite dev szerver (standalone, Mock SDK) — http://localhost:5174
bun run build      # IIFE bundle elkészítése (dist/index.iife.js)
bun run build:watch  # Build figyelő módban
bun run package    # .elyospkg csomag elkészítése
```

### Ha `remote_functions` engedélyezve van

```bash
bun run dev:server  # Dev szerver indítása — http://localhost:5175
```

A `dev:server` egy Bun HTTP szervert indít, amely:
- Statikus fájlokat szolgál ki a `dist/` mappából és a projekt gyökeréből (CORS fejlécekkel)
- `POST /api/remote/:functionName` endpointot biztosít a `server/functions.ts` függvényeinek hívásához

### Ha `database` is engedélyezve van

```bash
bun db:up           # Docker Postgres konténer indítása
bun db:down         # Docker Postgres konténer leállítása
bun run dev:full    # dev:server + dev párhuzamosan (egy terminálban)
```

A `dev:full` egyszerre indítja a Vite dev szervert (`5174`) és a dev szervert (`5175`), így nem kell két terminál.

:::note
A `dev:server` adatbázis módban induláskor automatikusan futtatja a migrációkat — először a `migrations/dev/` almappa fájljait (auth seed), majd a `migrations/` fájljait sorrendben. Ha az adatbázis nem elérhető, a szerver hibaüzenettel leáll.
:::

### Első indítás adatbázissal

```bash
cp .env.example .env   # Környezeti változók beállítása
bun db:up              # Postgres konténer indítása (Docker szükséges)
bun run dev:full       # Dev szerver + Vite egyszerre
```

A `.env.example` tartalmazza az alapértelmezett kapcsolati URL-t a Docker Compose által indított adatbázishoz:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/{plugin_id}_dev
PORT=5175
DEV_USER_ID=dev-user
```

---

## Standalone fejlesztés (Mock SDK)

Az alkalmazás fejleszthető futó ElyOS példány nélkül is. A `@elyos-dev/sdk/dev` csomag egy Mock SDK-t biztosít, amely szimulálja az összes SDK szolgáltatást:

| SDK szolgáltatás | Mock viselkedés |
|---|---|
| `ui.toast()` | `console.log`-ba ír |
| `ui.dialog()` | `window.confirm` / `window.prompt` |
| `data.set/get/delete()` | `localStorage`-t használ (`devapp:{appId}:` kulcs prefix alatt) |
| `data.query()` | Üres tömböt ad vissza |
| `remote.call()` | Konfigurálható mock handler |
| `i18n.t()` | A megadott fordítási mapből olvas |
| `notifications.send()` | `console.log`-ba ír |

:::note
ElyOS-be betöltve a `ui.toast()` a core Sonner toast rendszerét, a `ui.dialog()` a core saját dialog komponensét, a `notifications.send()` pedig toast-ot jelenít meg (az adatbázisban nem regisztrált dev alkalmazás esetén). A `data.set/get/delete()` hívások dev módban szintén `localStorage`-ba írnak (`devapp:{appId}:` prefix alatt), mivel a dev alkalmazás nincs az adatbázisban regisztrálva.
:::

### Dev szerver indítása

```bash
bun dev
```

A Vite dev szerver elindul a `http://localhost:5174` címen. A hot reload automatikusan frissíti a böngészőt minden mentéskor.

Ha `remote_functions` is engedélyezve van, a `bun dev` mellé párhuzamosan szükséges a `bun run dev:server` is (vagy használd a `bun run dev:full` parancsot, ha `database` is engedélyezve van).

:::note
Ha a `http://localhost:5174` 404-et ad, ellenőrizd, hogy van-e `index.html` a projekt gyökerében. A CLI által generált projektek ezt automatikusan tartalmazzák.
:::

### Mock SDK inicializálás

A `src/main.ts` fájlban a Mock SDK inicializálása automatikusan megtörténik:

```typescript
// src/main.ts
import { MockWebOSSDK } from '@elyos-dev/sdk/dev';
import App from './App.svelte';
import { mount } from 'svelte';

// Csak akkor fut le, ha NEM ElyOS-ben vagyunk
if (typeof window !== 'undefined' && !window.webOS) {
  MockWebOSSDK.initialize({
    i18n: {
      locale: 'en',
      translations: {
        en: { title: 'My App', welcome: 'Welcome!' },
        hu: { title: 'Alkalmazás', welcome: 'Üdvözöljük!' }
      }
    },
    context: {
      pluginId: 'my-app',
      user: {
        id: 'dev-user',
        name: 'Developer',
        email: 'dev@localhost',
        roles: ['admin'],
        groups: []
      },
      permissions: ['database', 'notifications', 'remote_functions']
    }
  });
}

const target = document.getElementById('app');
if (target) mount(App, { target });
```

Az `initialize()` összes konfigurációs lehetősége:

| Opció | Típus | Leírás |
|---|---|---|
| `i18n.locale` | `string` | Alapértelmezett nyelv (pl. `'hu'`) |
| `i18n.translations` | `Record<string, Record<string, string>>` | Fordítási kulcsok nyelvenkénti mapje |
| `context.pluginId` | `string` | Szimulált alkalmazás ID |
| `context.user` | `UserInfo` | Szimulált bejelentkezett felhasználó |
| `context.permissions` | `string[]` | Szimulált jogosultságok |
| `data.initialData` | `Record<string, unknown>` | Előre feltöltött localStorage adatok |
| `remote.handlers` | `Record<string, Function>` | Mock szerver függvény handlerek |
| `assets.baseUrl` | `string` | Asset URL prefix |

Amikor az ElyOS betölti az alkalmazást élesben, a `window.webOS` már létezik, ezért az `if (!window.webOS)` feltétel miatt a Mock SDK nem fut le.

### Remote call mock-olása

Ha szerver függvényeket is tesztelsz standalone módban:

```typescript
MockWebOSSDK.initialize({
  remote: {
    handlers: {
      getServerTime: async () => ({
        iso: new Date().toISOString(),
        locale: new Date().toLocaleString('hu-HU')
      }),
      calculate: async ({ a, b, operation }) => {
        if (operation === 'add') return { result: a + b };
        throw new Error('Unsupported operation');
      }
    }
  }
});
```

### Dev szerver port konfigurálhatóság

A `dev:server` alapértelmezetten az `5175`-ös portot használja (a Vite dev szerver a `5174`-est). Ha egyszerre több alkalmazást fejlesztesz, a port a `PORT` környezeti változóval felülírható a `.env` fájlban vagy közvetlenül:

```bash
PORT=5176 bun run dev:server
```

Az ElyOS Dev Alkalmazások betöltőjében az URL-t ennek megfelelően add meg: `http://localhost:5176`.

---

## Tesztelés futó ElyOS-ben

A standalone dev mód (Mock SDK) csak a UI-t teszteli. Ha valódi SDK hívásokat, adatbázist vagy szerver függvényeket is tesztelni szeretnél, az alkalmazást be kell tölteni egy futó ElyOS példányba.

A folyamat lényege: **buildeld le az alkalmazást, indíts egy statikus HTTP szervert (`dev:server`), majd töltsd be az ElyOS-be URL alapján.** Nincs automatikus hot reload — ha változtattál a kódon, újra kell buildelni és újra megnyitni az alkalmazás ablakát.

:::note[Portok]
- `5174` — Vite dev szerver (`bun dev`) — standalone fejlesztéshez, Mock SDK-val
- `5175` — Plugin dev szerver (`bun run dev:server`) — ElyOS-be való betöltéshez, valódi SDK-val
:::

### 1. lépés — ElyOS core indítása

Az `elyos-core` monorepo gyökerében:

```bash
# .env.local fájlban engedélyezd a dev alkalmazás betöltést:
# DEV_MODE=true

bun app:dev
```

Az ElyOS alapértelmezetten a `http://localhost:5173` címen érhető el. Jelentkezz be admin fiókkal.

### 2. lépés — Alkalmazás buildelése

Az alkalmazás projekt mappájában:

```bash
bun run build
```

Ez létrehozza a `dist/index.iife.js` fájlt — ezt tölti be az ElyOS.

### 3. lépés — Plugin dev szerver indítása

```bash
bun run dev:server
```

Ez elindítja a `dev-server.ts` Bun HTTP szervert a `http://localhost:5175` címen. A szerver a `dist/` mappából és a projekt gyökeréből szolgálja ki a fájlokat CORS fejlécekkel.

Ha `database` is engedélyezve van, a szerver induláskor automatikusan futtatja a migrációkat, és a `POST /api/remote/:functionName` endpointon keresztül elérhetők a `server/functions.ts` függvényei.

:::note
A `dev:server` csak statikus fájlokat szolgál ki — nincs hot reload, nincs Vite. Ha módosítottad a kódot, futtasd újra a `bun run build`-ot, majd zárd be és nyisd meg újra az alkalmazás ablakát az ElyOS-ben.
:::

### 4. lépés — Alkalmazás betöltése az ElyOS-be

:::caution[Előfeltételek]
A "Dev Alkalmazások" menüpont csak akkor jelenik meg az Alkalmazás Managerben, ha:
- Az ElyOS `.env.local` fájlban `DEV_MODE=true` van beállítva
- A bejelentkezett felhasználónak van `app.manual.install` jogosultsága (admin fióknak alapból van)
:::

1. Nyisd meg az ElyOS-t a böngészőben
2. Start menü → Alkalmazás Manager
3. A bal oldalsávban kattints a **"Dev Alkalmazások"** menüpontra
4. Megjelenik egy URL beviteli mező `http://localhost:5175` alapértelmezett értékkel
5. Kattints a **"Load"** gombra

Az ElyOS lekéri a `manifest.json`-t a dev szerverről, majd betölti az IIFE bundle-t és Web Component-ként regisztrálja az alkalmazást.

:::tip[Docker-ben fut az ElyOS?]
Ha az ElyOS Docker konténerben fut (pl. `bun docker:up` paranccsal indítva), a konténer nem éri el a host gép `localhost`-ját. Helyette használd a `host.docker.internal` címet:

```
http://host.docker.internal:5174
```

A szerver oldali validáció elfogadja ezt a címet, a böngésző pedig automatikusan `localhost`-ot kap vissza az URL-ben — így a plugin mindkét oldalról helyesen töltődik be.
:::

### Módosítás utáni újratöltés

```bash
# 1. Újrabuildelés
bun run build

# 2. Az ElyOS-ben: zárd be az alkalmazás ablakát, majd nyisd meg újra
#    (a "Load" gombot nem kell újra megnyomni — az alkalmazás már a listában van)
```

### Teljes dev workflow összefoglalva

**Alap (remote_functions nélkül):**

```bash
# Terminál 1 — ElyOS core
cd elyos-core && bun app:dev

# Terminál 2 — Alkalmazás build + szerver
cd my-app
bun run build       # IIFE bundle elkészítése
bun run dev:server  # statikus szerver indítása (http://localhost:5175)

# ElyOS-ben: Alkalmazás Manager → Dev Alkalmazások → Load → http://localhost:5175
```

**Adatbázissal (database + remote_functions):**

```bash
# Terminál 1 — ElyOS core
cd elyos-core && bun app:dev

# Terminál 2 — Alkalmazás (első alkalommal)
cd my-app
cp .env.example .env   # DATABASE_URL és PORT beállítása
bun db:up              # Postgres konténer indítása

# Terminál 2 — Alkalmazás (minden alkalommal)
bun run build          # IIFE bundle elkészítése
bun run dev:server     # dev szerver + migrációk + remote endpoint (http://localhost:5175)

# ElyOS-ben: Alkalmazás Manager → Dev Alkalmazások → Load → http://localhost:5175
```

---

## Plugin telepítése (`.elyospkg`)

Ha az alkalmazás fejlesztése kész, csomagold be és telepítsd az ElyOS-be.

### Csomag elkészítése

```bash
bun run build    # IIFE bundle elkészítése
bun run package  # .elyospkg fájl létrehozása
```

Ez létrehozza a `{id}-{version}.elyospkg` fájlt (pl. `my-app-1.0.0.elyospkg`). A csomag egy ZIP archívum, amely tartalmazza:

- `manifest.json`
- `dist/` — build output (IIFE bundle)
- `locales/` — fordítások (ha van)
- `assets/` — statikus fájlok (ha van)
- `menu.json` — oldalsáv konfiguráció (ha van)
- `server/` — szerver oldali függvények (ha van)
- `migrations/` — adatbázis migrációk (ha van, dev seed fájlok nélkül)

### Feltöltés az ElyOS-be

1. Start menü → Alkalmazás Manager → **Plugin Feltöltés**
2. Húzd rá a `.elyospkg` fájlt, vagy kattints a böngészés gombra
3. Az ElyOS validálja a csomagot, majd megmutatja az előnézetet
4. Kattints a **Telepítés** gombra

A telepítés során az ElyOS:
- Kicsomagolja a fájlokat a plugin tárolóba
- Regisztrálja az alkalmazást az app registry-ben
- Importálja a fordításokat (ha van `locales/`)
- Létrehozza a plugin adatbázis sémát (ha `database` jogosultság van)
- Regisztrálja az email template-eket (ha `notifications` jogosultság van)

:::caution
A plugin feltöltéséhez `plugin.manual.install` jogosultság szükséges (admin fióknak alapból van).
:::

---

## Manifest fájl

A `manifest.json` az alkalmazás metaadatait tartalmazza. Kötelező és opcionális mezők:

```json
{
  "id": "my-app",
  "name": { "hu": "Alkalmazásom", "en": "My App" },
  "version": "1.0.0",
  "description": { "hu": "Rövid leírás", "en": "Short description" },
  "author": "Szerző Neve <email@example.com>",
  "entry": "dist/index.iife.js",
  "icon": "assets/icon.svg",
  "iconStyle": "cover",
  "category": "utilities",
  "permissions": ["database", "notifications", "remote_functions"],
  "multiInstance": false,
  "defaultSize": { "width": 800, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "maxSize": { "width": 1920, "height": 1080 },
  "keywords": ["example", "demo"],
  "isPublic": false,
  "sortOrder": 100,
  "dependencies": {
    "svelte": "^5.0.0",
    "@lucide/svelte": "^1.0.0"
  },
  "minWebOSVersion": "2.0.0",
  "locales": ["hu", "en"]
}
```

### Jogosultságok

| Jogosultság | Leírás | SDK funkciók |
|---|---|---|
| `database` | Adatbázis hozzáférés | `data.set()`, `data.get()`, `data.query()` |
| `notifications` | Értesítések küldése | `notifications.send()` |
| `remote_functions` | Szerver oldali függvények | `remote.call()` |
| `file_access` | Fájl hozzáférés | (tervezett) |
| `user_data` | Felhasználói adatok | (tervezett) |

### ID formátum szabályok

- Csak kisbetűk, számok és kötőjel (`kebab-case`)
- Minimum 3, maximum 50 karakter
- Regex: `^[a-z0-9-]+$`

```json
"id": "my-app"    // ✅ Helyes
"id": "MyApp"     // ❌ Hibás
"id": "my_app"    // ❌ Hibás
```

---

## WebOS SDK API

Az SDK a `window.webOS` globális objektumon keresztül érhető el:

```typescript
const sdk = window.webOS!;
```

### UI Service

```typescript
// Toast értesítés
sdk.ui.toast('Üzenet', 'success');
// type: 'info' | 'success' | 'warning' | 'error'

// Dialógus
const result = await sdk.ui.dialog({
  title: 'Cím',
  message: 'Üzenet',
  type: 'confirm' // 'info' | 'confirm' | 'prompt'
});
```

### Remote Service

```typescript
// Szerver függvény hívása
const result = await sdk.remote.call('functionName', { param: 'value' });

// Generikus visszatérési típussal
const result = await sdk.remote.call<MyResult>('functionName', params);
```

### Data Service

```typescript
// Kulcs-érték tárolás
await sdk.data.set('key', { value: 123 });
const value = await sdk.data.get('key');
await sdk.data.delete('key');

// SQL lekérdezés (csak a plugin saját sémájában!)
const rows = await sdk.data.query('SELECT * FROM my_table WHERE id = $1', [123]);

// Tranzakció
await sdk.data.transaction(async (tx) => {
  await tx.query('INSERT INTO ...');
  await tx.query('UPDATE ...');
  await tx.commit();
});
```

### I18n Service

```typescript
// Fordítás
const text = sdk.i18n.t('key');

// Paraméterekkel
const text = sdk.i18n.t('welcome', { name: 'John' });

// Aktuális nyelv
const locale = sdk.i18n.locale; // 'hu' | 'en'

// Nyelv váltás
await sdk.i18n.setLocale('en');
```

### Notification Service

```typescript
await sdk.notifications.send({
  userId: 'user-123',
  title: 'Cím',
  message: 'Üzenet',
  type: 'info' // 'info' | 'success' | 'warning' | 'error'
});
```

### Context Service

```typescript
const pluginId = sdk.context.pluginId;
const user = sdk.context.user;
const permissions = sdk.context.permissions;

// Ablak vezérlők
sdk.context.window.close();
sdk.context.window.setTitle('Új cím');
```

### Asset Service

```typescript
const iconUrl = sdk.assets.getUrl('icon.svg');
const imageUrl = sdk.assets.getUrl('images/logo.png');
```

---

## TypeScript és autocomplete

Az `@elyos-dev/sdk` teljes TypeScript típusdefiníciókat tartalmaz. A `window.webOS` típusa automatikusan elérhető:

```typescript
// Automatikus típus — nincs szükség importra
const sdk = window.webOS!;

sdk.ui.toast('Hello!', 'success');       // ✅ autocomplete
sdk.data.set('key', { value: 123 });     // ✅ típusellenőrzés
sdk.remote.call<MyResult>('fn', params); // ✅ generikus visszatérési típus
```

Explicit típusimport szükség esetén:

```typescript
import type { WebOSSDKInterface, UserInfo } from '@elyos-dev/sdk/types';

const user: UserInfo = sdk.context.user;
```

---

## Svelte 5 runes a pluginban

A plugin Svelte 5 runes-alapú reaktivitást használ. A `vite.config.ts`-ben a `runes: true` compiler opció be van kapcsolva:

```svelte
<script lang="ts">
  const sdk = window.webOS!;

  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    sdk.ui.toast(`Count: ${count}`, 'info');
  });
</script>

<button onclick={() => count++}>
  {count} (doubled: {doubled})
</button>
```

:::caution
A plugin **nem** használhatja a SvelteKit-specifikus importokat (`$app/navigation`, `$app/stores`, stb.) — ezek csak a host alkalmazásban érhetők el.
:::

---

## Szerver oldali függvények

Ha a `remote_functions` feature engedélyezve van, a `server/functions.ts` fájlban definiálhatók szerver oldali függvények:

```typescript
// server/functions.ts
import type { PluginFunctionContext } from '@elyos-dev/sdk/types';

export async function getItems(
  params: { page: number; pageSize: number },
  context: PluginFunctionContext
) {
  const { db, pluginId } = context;
  const schema = `app__${pluginId.replace(/-/g, '_')}`;

  const rows = await db.query(
    `SELECT * FROM ${schema}.items LIMIT $1 OFFSET $2`,
    [params.pageSize, (params.page - 1) * params.pageSize]
  );

  return { success: true, data: rows };
}
```

Hívás a kliensről:

```typescript
const result = await sdk.remote.call('getItems', { page: 1, pageSize: 20 });
```

---

## Adatbázis migrációk

Ha a `database` feature engedélyezve van, a `migrations/` mappában SQL fájlok definiálják a plugin saját adatbázis sémáját. A fájlok névsorrendben futnak le (pl. `001_init.sql`, `002_add_column.sql`).

```sql
-- migrations/001_init.sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

:::note
A táblaneveket nem kell sémával prefixelni a migrációs fájlokban — az ElyOS telepítéskor automatikusan hozzáadja a `app__{plugin_id}` prefixet.
:::

A `migrations/dev/` mappában lévő fájlok csak fejlesztési célra szolgálnak (pl. seed adatok) — a `.elyospkg` csomagba nem kerülnek bele.

---

## Stílus kezelés

### CSS injektálás

A plugin CSS-e az IIFE build során a `vite-plugin-css-injected-by-js` plugin segítségével automatikusan a JS bundle-be kerül. Ez a plugin a `create-elyos-app` által generált `vite.config.ts`-ben már benne van — nem kell kézzel hozzáadni.

### Specificitási ütközések

A core app Tailwind stílusai (base layer resetok) felülírhatják a plugin stílusait. A Svelte scoped CSS `button.svelte-xxxx` selectorokat generál, de a Tailwind `button { ... }` resetje magasabb specificitással töltődik be.

A megoldás: mindig egy saját konténer osztályon belül definiáld a stílusokat:

```svelte
<!-- ❌ Rossz — a core stílusai felülírják -->
<style>
  button { border: 1px solid #ccc; }
</style>

<!-- ✅ Helyes — konténer osztályon belül scopelve -->
<style>
  .my-plugin button { border: 1px solid #ccc; }
</style>
```

Ha a core stílusai felülírnak egy elemet, az `all: revert` visszaállítja a böngésző natív stílusát:

```svelte
<style>
  .my-plugin button {
    all: revert;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
  }
</style>
```

### Összefoglalás

| Szabály | Miért |
|---|---|
| Konténer osztályon belül scopelj (`.my-plugin button`) | A core Tailwind stílusai felülírják a nyers tag selectorokat |
| Szükség esetén használj `all: revert`-et | Visszaállítja a böngésző natív stílusát |
| Adj egyedi osztálynevet a gyökér konténernek | Elkerüli az ütközést más pluginok stílusaival |

---

## Biztonsági szabályok

### Tiltott

- `eval()` és `Function()` konstruktor
- `innerHTML` és `document.write()`
- Külső domain-ekre fetch/XHR
- Dinamikus import külső URL-ről
- Más plugin sémák elérése
- System sémák elérése (`platform`, `auth`, `public`)

### Engedélyezett függőségek

A manifest `dependencies` mezőjében csak fehérlistán lévő package-ek szerepelhetnek:

- `svelte` (^5.x.x)
- `@lucide/svelte` / `lucide-svelte`
- `phosphor-svelte`
- `@elyos/*` és `@elyos-dev/*` (minden verzió)

---

## Gyakori hibák

| Hiba | Megoldás |
|---|---|
| `"Invalid plugin ID format"` | Használj kebab-case-t: `my-plugin` |
| `"Permission denied"` | Add hozzá a jogosultságot a `manifest.json`-ban |
| `"Module not found"` | Futtasd le: `bun run build` |
| `"Plugin already exists"` | Az adott ID-vel már telepítve van egy plugin — távolítsd el előbb |
| `"Plugin is inactive"` | A plugin inaktív állapotban van — aktiváld az Alkalmazás Managerben |
| Dev alkalmazás nem jelenik meg | Ellenőrizd, hogy `DEV_MODE=true` van-e az ElyOS `.env.local`-ban |
