---
title: SDK API referencia
description: A WebOS SDK összes service-ének részletes dokumentációja – ui, data, remote, i18n, notifications, context, assets
---

A WebOS SDK a `window.webOS` globális objektumon keresztül érhető el. ElyOS-ben a runtime SDK automatikusan inicializálódik — standalone fejlesztéshez a Mock SDK-t kell használni (lásd [Fejlesztői workflow](/hu/apps-development/)).

```typescript
const sdk = window.webOS!;
```

## UI Service — `sdk.ui`

### `toast(message, type?, duration?)`

Toast értesítés megjelenítése.

```typescript
sdk.ui.toast('Mentve!', 'success');
sdk.ui.toast('Hiba történt', 'error');
sdk.ui.toast('Figyelem', 'warning', 5000);
sdk.ui.toast('Információ', 'info');
```

| Paraméter | Típus | Leírás |
|---|---|---|
| `message` | `string` | Megjelenítendő szöveg |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | Toast típusa (alapértelmezett: `'info'`) |
| `duration` | `number` | Megjelenítési idő ms-ban (alapértelmezett: 3000) |

### `dialog(options)`

Modális dialógus megjelenítése. ElyOS-ben a core saját dialog komponensét használja — nem `window.alert/confirm/prompt`.

```typescript
// Megerősítés kérése
const result = await sdk.ui.dialog({
  title: 'Törlés megerősítése',
  message: 'Biztosan törölni szeretnéd?',
  type: 'confirm'
});

if (result.action === 'confirm') {
  // törlés...
}

// Szöveg bekérése
const result = await sdk.ui.dialog({
  title: 'Új elem neve',
  message: 'Add meg a nevet:',
  type: 'prompt'
});

if (result.action === 'submit') {
  console.log(result.value); // a beírt szöveg
}

// Információ megjelenítése
await sdk.ui.dialog({
  title: 'Kész',
  message: 'A művelet sikeresen befejeződött.',
  type: 'info'
});
```

A visszatérési érték mindig `DialogResult`:

| `action` érték | Mikor | `value` |
|---|---|---|
| `'ok'` | Info dialog bezárva | — |
| `'confirm'` | Confirm dialog → Megerősítés | — |
| `'cancel'` | Bármely dialog → Mégse / ESC | — |
| `'submit'` | Prompt dialog → Küldés | a beírt szöveg |

### `theme`

Az aktuális téma színei.

```typescript
const colors = sdk.ui.theme;
console.log(colors.primary);    // pl. '#667eea'
console.log(colors.background); // pl. '#ffffff'
```

### `components`

ElyOS UI komponensek (Button, Input, Card, stb.) — ezek a host alkalmazás komponensei, amelyek a plugin számára is elérhetők.

```typescript
const { Button, Input, Card } = sdk.ui.components;
```

---

## Data Service — `sdk.data`

Kulcs-érték tárolás és SQL lekérdezések a plugin saját sémájában. Szükséges jogosultság: `database`.

### Adatbázis séma telepítéskor

Ha a plugin `manifest.json`-jában szerepel a `"database"` jogosultság, a telepítő automatikusan létrehoz egy dedikált PostgreSQL sémát a plugin számára:

```
plugin_{plugin_id}
```

Például a `my-plugin` plugin sémája: `plugin_my_plugin` (a kötőjelek aláhúzásra cserélődnek).

A séma alapból tartalmaz egy `kv_store` táblát (a `set/get/delete` műveletekhez) és egy `migrations` nyilvántartó táblát. Ha a plugin nem kér `database` jogosultságot, séma sem jön létre.

### Migrációk (`migrations/` mappa)

Ha a pluginnak saját táblastruktúrára van szüksége (pl. `notes`, `items`, stb.), a `migrations/` mappában SQL fájlokat helyezhetsz el. A telepítő ezeket névsorrendben futtatja le, és nyilvántartja, hogy melyik migration volt már alkalmazva.

**Névkonvenció:** `001_init.sql`, `002_add_column.sql`, stb.

```sql
-- migrations/001_init.sql
-- A táblaneveket a telepítő automatikusan prefixeli a plugin sémával
-- (pl. notes → plugin_my_plugin.notes)

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_created_at ON notes (created_at);
```

:::tip
Nem kell kiírni a séma prefixet (`plugin_my_plugin.notes`) — a telepítő automatikusan hozzáfűzi. Ha mégis megadod, a telepítő nem duplikálja.
:::

**Hibakezelés:** Ha egy migration SQL szintaktikailag hibás vagy futás közben meghiúsul, a teljes plugin telepítés sikertelen lesz és rollback indul. A hibaüzenet tartalmazza a fájl nevét és az adatbázis hibaüzenetét.

A `migrations/` mappát a `build-package.js` automatikusan belecsomag a `.elyospkg`-ba, ha létezik.

### `set(key, value)`

```typescript
await sdk.data.set('settings', { darkMode: true, language: 'hu' });
await sdk.data.set('counter', 42);
```

### `get<T>(key)`

```typescript
const settings = await sdk.data.get<{ darkMode: boolean }>('settings');
const counter = await sdk.data.get<number>('counter');
```

### `delete(key)`

```typescript
await sdk.data.delete('settings');
```

### `query<T>(sql, params?)`

SQL lekérdezés a plugin saját sémájában (`plugin_{plugin_id}`). Csak a saját sémában lévő táblák érhetők el.

```typescript
interface Item {
  id: number;
  name: string;
  created_at: string;
}

const items = await sdk.data.query<Item>(
  'SELECT * FROM my_table WHERE active = $1 ORDER BY created_at DESC',
  [true]
);

items.forEach(item => console.log(item.name));
```

:::caution
Csak a plugin saját sémájában (`plugin_{id}`) lévő táblák érhetők el. A `platform`, `auth` és más pluginok sémái nem elérhetők.
:::

### `transaction(callback)`

Tranzakció végrehajtása.

```typescript
await sdk.data.transaction(async (tx) => {
  await tx.query('INSERT INTO items (name) VALUES ($1)', ['Új elem']);
  await tx.query('UPDATE counters SET value = value + 1');
  await tx.commit();
});
```

---

## Remote Service — `sdk.remote`

Szerver oldali függvények hívása. Szükséges jogosultság: `remote_functions`.

### `call<T>(functionName, params?, options?)`

```typescript
// Egyszerű hívás
const time = await sdk.remote.call<{ iso: string }>('getServerTime');

// Paraméterekkel
const result = await sdk.remote.call<{ result: number }>('calculate', {
  a: 10,
  b: 5,
  operation: 'add'
});

// Timeout beállítással
const data = await sdk.remote.call('fetchData', { page: 1 }, { timeout: 10000 });
```

A szerver függvények a plugin `server/functions.js` (vagy `.ts`) fájljában vannak definiálva. Részletek: [Szerver függvények](/hu/plugins-server-functions/).

**Automatikus funkciók:**
- 3x újrapróbálkozás exponenciális backoff-fal
- Auth token automatikus csatolása
- Timeout kezelés (alapértelmezett: 30 másodperc)

---

## I18n Service — `sdk.i18n`

Fordítások kezelése. A fordítási fájlok a `locales/` mappában vannak.

### `t(key, params?)`

```typescript
// Egyszerű fordítás
const label = sdk.i18n.t('save');

// Paraméterekkel
const greeting = sdk.i18n.t('welcome', { name: 'Kovács János' });
// locales/hu.json: { "welcome": "Üdvözöljük, {name}!" }
```

### `locale`

Az aktuális nyelv ISO kódja.

```typescript
const lang = sdk.i18n.locale; // 'hu' | 'en'
```

### `setLocale(locale)`

Nyelv váltása.

```typescript
await sdk.i18n.setLocale('en');
```

### `ready()`

Megvárja, amíg a fordítások betöltődnek.

```typescript
await sdk.i18n.ready();
const text = sdk.i18n.t('title');
```

---

## Notification Service — `sdk.notifications`

Rendszerértesítések küldése. Szükséges jogosultság: `notifications`.

### `send(options)`

```typescript
await sdk.notifications.send({
  userId: 'user-123',
  title: 'Feladat kész',
  message: 'Az exportálás sikeresen befejeződött.',
  type: 'success'
});
```

| Mező | Típus | Leírás |
|---|---|---|
| `userId` | `string` | A célfelhasználó ID-ja |
| `title` | `string` | Értesítés címe |
| `message` | `string` | Értesítés szövege |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | Értesítés típusa |

---

## Context Service — `sdk.context`

A plugin és a felhasználó kontextusa.

### `pluginId`

```typescript
const id = sdk.context.pluginId; // pl. 'my-plugin'
```

### `user`

```typescript
const user = sdk.context.user;
console.log(user.id);     // felhasználó ID
console.log(user.name);   // megjelenítendő név
console.log(user.email);  // email cím
console.log(user.roles);  // ['admin', 'user', ...]
console.log(user.groups); // csoportok listája
```

### `params`

A plugin megnyitásakor átadott paraméterek.

```typescript
const params = sdk.context.params;
// pl. { itemId: '123', mode: 'edit' }
```

### `permissions`

A plugin által kapott jogosultságok listája.

```typescript
const perms = sdk.context.permissions;
// pl. ['database', 'remote_functions']

if (perms.includes('notifications')) {
  // értesítés küldése...
}
```

### `window.setTitle(title)`

Az ablak fejlécének módosítása.

```typescript
sdk.context.window.setTitle('My Plugin — Beállítások');
```

### `window.close()`

Az ablak bezárása.

```typescript
sdk.context.window.close();
```

---

## Asset Service — `sdk.assets`

Plugin asset-ek URL-jének generálása.

### `getUrl(assetPath)`

```typescript
const iconUrl = sdk.assets.getUrl('icon.svg');
const imageUrl = sdk.assets.getUrl('images/banner.png');
```

Használat Svelte template-ben:

```svelte
<img src={sdk.assets.getUrl('logo.png')} alt="Logo" />
```

---

## Hibakezelés

A remote hívások és az adatbázis műveletek dobhatnak hibát. Mindig használj try-catch-et:

```typescript
try {
  const result = await sdk.remote.call('myFunction', params);
  sdk.ui.toast('Sikeres!', 'success');
} catch (error) {
  // Lehetséges hibakódok:
  // PLUGIN_NOT_FOUND, PLUGIN_INACTIVE
  // PERMISSION_DENIED
  // REMOTE_CALL_TIMEOUT
  // NETWORK_ERROR, SERVER_ERROR

  sdk.ui.toast('Hiba történt', 'error');
  console.error(error);
}
```
