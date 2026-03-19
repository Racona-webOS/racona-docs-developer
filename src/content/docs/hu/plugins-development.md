---
title: Fejlesztői workflow
description: Alkalmazás fejlesztés standalone módban Mock SDK-val – hot reload, lokális tesztelés, ElyOS-ben való tesztelés
---

## Standalone fejlesztés (Mock SDK)

Az alkalmazás fejleszthető futó ElyOS példány nélkül is. A `@elyos/sdk/dev` csomag egy Mock SDK-t biztosít, amely szimulálja az összes SDK szolgáltatást:

| SDK szolgáltatás | Mock viselkedés |
|---|---|
| `ui.toast()` | `console.log`-ba ír |
| `ui.dialog()` | `window.confirm` / `window.prompt` (standalone módban) |
| `data.set/get/delete()` | `localStorage`-t használ (`devapp:{appId}:` kulcs prefix alatt) |
| `data.query()` | Üres tömböt ad vissza |
| `remote.call()` | Konfigurálható mock handler |
| `i18n.t()` | A megadott fordítási mapből olvas |
| `notifications.send()` | `console.log`-ba ír |

:::note
ElyOS-be betöltve (dev alkalmazás módban) a `ui.toast()` a core Sonner toast rendszerét, a `ui.dialog()` a core saját dialog komponensét, a `notifications.send()` pedig toast-ot jelenít meg (az adatbázisban nem regisztrált dev alkalmazás esetén). A `data.set/get/delete()` hívások dev módban szintén `localStorage`-ba írnak (`devapp:{appId}:` prefix alatt), mivel a dev alkalmazás nincs az adatbázisban regisztrálva — a valódi adatbázis séma csak telepített alkalmazásnál érhető el. Standalone módban (Mock SDK) a fenti fallback viselkedés érvényes.
:::

### Dev szerver indítása

A dev szerver indításához szükség van egy `index.html` fájlra a projekt gyökerében — ezt a Vite keresi belépési pontként. A CLI által generált projektek ezt automatikusan tartalmazzák.

```bash
bun dev
```

Az alkalmazás elérhető lesz a `http://localhost:5174` címen. A Vite hot reload automatikusan frissíti a böngészőt minden mentéskor.

### Dev szerver port konfigurálhatóság

Ha egyszerre több alkalmazást fejlesztesz, a `dev` (Vite) és a `dev:server` (statikus szerver) parancsok alapértelmezetten az `5174`-es portot használják. Ez ütközést okoz, ha mindkét alkalmazás egyszerre fut.

A port a `PORT` környezeti változóval felülírható:

```bash
# Első alkalmazás — alapértelmezett port
bun run dev:server

# Második alkalmazás — más porton
PORT=5175 bun run dev:server
```

Az ElyOS Dev Alkalmazások betöltőjében az URL-t ennek megfelelően add meg: `http://localhost:5175`.

:::note
Ha a `http://localhost:5174` 404-et ad, ellenőrizd, hogy van-e `index.html` a projekt gyökerében. Ha nincs, hozd létre:

```html
<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ElyOS Alkalmazás Dev</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```
:::

### Mock SDK inicializálás

A Mock SDK (`@elyos/sdk/dev`) egy fejlesztői csomag, amely szimulálja a valódi `window.webOS` SDK-t — futó ElyOS példány nélkül. Amikor az alkalmazás standalone módban fut (pl. `bun dev`), a `window.webOS` még nem létezik, ezért a `MockWebOSSDK.initialize()` hozza létre és teszi elérhetővé.

A `src/main.ts` fájlban ez automatikusan megtörténik:

```typescript
// src/main.ts
import { mount } from 'svelte';
import { MockWebOSSDK } from '@elyos/sdk/dev';
import App from './App.svelte';

async function initDevSDK() {
  if (typeof window !== 'undefined' && !window.webOS) {
    // Csak akkor fut le, ha NEM ElyOS-ben vagyunk
    MockWebOSSDK.initialize({
      // Fordítások a fejlesztéshez
      i18n: {
        locale: 'en',
        translations: {
          en: { title: 'My App', welcome: 'Welcome!' },
          hu: { title: 'Alkalmazás', welcome: 'Üdvözöljük!' }
        }
      },
      // Szimulált felhasználó és jogosultságok
      context: {
        appId: 'my-app',
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
}

async function init() {
  await initDevSDK();
  const target = document.getElementById('app');
  if (target) mount(App, { target });  // Svelte 5: mount() — nem new App()
}

init();
```

Az `initialize()` összes konfigurációs lehetősége:

| Opció | Típus | Leírás |
|---|---|---|
| `i18n.locale` | `string` | Alapértelmezett nyelv (pl. `'hu'`) |
| `i18n.translations` | `Record<string, Record<string, string>>` | Fordítási kulcsok nyelvenkénti mapje |
| `context.appId` | `string` | Szimulált alkalmazás ID |
| `context.user` | `UserInfo` | Szimulált bejelentkezett felhasználó |
| `context.permissions` | `string[]` | Szimulált jogosultságok |
| `data.initialData` | `Record<string, unknown>` | Előre feltöltött localStorage adatok |
| `remote.handlers` | `Record<string, Function>` | Mock szerver függvény handlerek |
| `assets.baseUrl` | `string` | Asset URL prefix |

Amikor az ElyOS betölti az alkalmazást élesben, a `window.webOS` már létezik (a runtime SDK-val feltöltve), ezért az `if (!window.webOS)` feltétel miatt a Mock SDK nem fut le.

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

## Tesztelés futó ElyOS-ben

A standalone dev mód (Mock SDK) csak a UI-t teszteli. Ha valódi SDK hívásokat, adatbázist vagy szerver függvényeket is tesztelni szeretnél, az alkalmazást be kell tölteni egy futó ElyOS példányba.

A folyamat lényege: **buildeld le az alkalmazást, indíts egy statikus HTTP szervert, majd töltsd be az ElyOS-be URL alapján.** Nincs automatikus hot reload — ha változtattál a kódon, újra kell buildelni és újra megnyitni az alkalmazás ablakát.

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

### 3. lépés — Statikus dev szerver indítása

```bash
bun run dev:server
```

Ez elindítja a `dev-server.ts` Bun HTTP szervert a `http://localhost:5174` címen. A szerver a `dist/` mappából és a projekt gyökeréből szolgálja ki a fájlokat CORS fejlécekkel.

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
4. Megjelenik egy URL beviteli mező `http://localhost:5174` alapértelmezett értékkel
5. Kattints a **"Load"** gombra

Az ElyOS lekéri a `manifest.json`-t a dev szerverről, majd betölti az IIFE bundle-t és Web Component-ként regisztrálja az alkalmazást.

:::note
Ha a "Dev Alkalmazások" menüpont nem jelenik meg, ellenőrizd hogy az ElyOS-t `DEV_MODE=true`-val indítottad-e el.
:::

### Módosítás utáni újratöltés

```bash
# 1. Újrabuildelés
bun run build

# 2. Az ElyOS-ben: zárd be az alkalmazás ablakát, majd nyisd meg újra
#    (a "Load" gombot nem kell újra megnyomni — az alkalmazás már a listában van)
```

### Teljes dev workflow összefoglalva

```bash
# Terminál 1 — ElyOS core
cd elyos-core && bun app:dev

# Terminál 2 — Alkalmazás build + szerver
cd my-app
bun run build       # IIFE bundle elkészítése
bun run dev:server  # statikus szerver indítása (http://localhost:5174)

# ElyOS-ben: Alkalmazás Manager → Dev Alkalmazások → Load → http://localhost:5174
```

## TypeScript és autocomplete

Az `@elyos/sdk` teljes TypeScript típusdefiníciókat tartalmaz. A `window.webOS` típusa automatikusan elérhető:

```typescript
// Automatikus típus — nincs szükség importra
const sdk = window.webOS!;

sdk.ui.toast('Hello!', 'success');       // ✅ autocomplete
sdk.data.set('key', { value: 123 });     // ✅ típusellenőrzés
sdk.remote.call<MyResult>('fn', params); // ✅ generikus visszatérési típus
```

Explicit típusimport szükség esetén:

```typescript
import type { WebOSSDKInterface, UserInfo } from '@elyos/sdk/types';

const user: UserInfo = sdk.context.user;
```

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

## Standalone módban való nyelvváltás (sidebar template)

A `sidebar` template `App.svelte`-je beépített nyelvváltó gombot tartalmaz az oldalsáv alján — ez csak akkor jelenik meg, ha a plugin több locale-t definiál. Standalone módban (Mock SDK) a `sdk.i18n.setLocale()` hívás a Mock SDK belső állapotát frissíti, és a `{#key currentLocale}` blokk újramountolja az aktív komponenst.

ElyOS-be betöltve a `setLocale()` a core i18n rendszerét hívja, amely az egész alkalmazás nyelvét váltja — nem csak a plugin nyelvét.

## Stílus kezelés

A plugin CSS-e az IIFE build során **nem kerül automatikusan a JS bundle-be** — a Vite lib módban külön `.css` fájlba szedi ki. Ha ez a fájl nem töltődik be, a plugin stílusai egyáltalán nem jelennek meg az ElyOS-ben.

### A CSS injektálási probléma

Amikor a Vite IIFE bundle-t épít, a Svelte komponensek CSS-ét egy külön fájlba (`dist/sample-01-plugin.css`) teszi. Az ElyOS csak a JS bundle-t tölti be — a CSS fájlt nem. Ennek eredménye: **a plugin stílusai teljesen hiányoznak**.

A megoldás a `vite.config.ts`-ben egy egyedi Vite plugin, amely a generált CSS-t `<style>` tagként injektálja a JS bundle elejére:

```typescript
// vite.config.ts
function injectCssPlugin(): Plugin {
  let cssContent = '';

  return {
    name: 'inject-css',
    apply: 'build',
    generateBundle(_, bundle) {
      // CSS fájl tartalmának összegyűjtése és eltávolítása a bundle-ből
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssContent += chunk.source as string;
          delete bundle[fileName];
        }
      }

      // CSS injektálása a JS bundle elejére
      if (cssContent) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.fileName.endsWith('.js')) {
            const injection = `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(cssContent)};document.head.appendChild(s);})();`;
            chunk.code = injection + chunk.code;
            break;
          }
        }
      }
    }
  };
}
```

Ez a plugin a `create-elyos-app` által generált `vite.config.ts`-ben már benne van — nem kell kézzel hozzáadni.

### Specificitási ütközések

Még ha a CSS be is töltődik, a core app Tailwind stílusai (base layer resetok) felülírhatják a plugin stílusait. Ez **minden betöltési módban** (dev URL és telepített `.elyospkg`) ugyanígy viselkedik.

A Svelte scoped CSS `button.svelte-xxxx` selectorokat generál, de a Tailwind `button { ... }` resetje magasabb specificitással töltődik be, így felülírja.

### A megoldás: konténer-alapú scopelés

Mindig egy saját konténer osztályon belül definiáld a stílusokat, és kerüld a nyers HTML tag selectorokat:

```svelte
<!-- ❌ Rossz — a core stílusai felülírják -->
<style>
  button {
    border: 1px solid #ccc;
    padding: 0.5rem 1rem;
  }
</style>

<!-- ✅ Helyes — konténer osztályon belül scopelve -->
<style>
  .my-plugin button {
    border: 1px solid #ccc;
    padding: 0.5rem 1rem;
  }
</style>
```

### `all: revert` — core stílusok visszaállítása

Ha a core stílusai felülírnak egy elemet, az `all: revert` visszaállítja a böngésző natív stílusát:

```svelte
<style>
  .my-plugin button {
    all: revert;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    background: white;
  }

  .my-plugin button:hover {
    background: #f0f0f0;
  }
</style>
```

### Összefoglalás

| Szabály | Miért |
|---|---|
| A `vite.config.ts`-ben legyen `injectCssPlugin()` | Nélküle a CSS egyáltalán nem töltődik be az ElyOS-ben |
| Konténer osztályon belül scopelj (`.my-plugin button`) | A core Tailwind stílusai felülírják a nyers tag selectorokat |
| Szükség esetén használj `all: revert`-et | Visszaállítja a böngésző natív stílusát |
| Adj egyedi osztálynevet a gyökér konténernek | Elkerüli az ütközést más pluginok stílusaival |
