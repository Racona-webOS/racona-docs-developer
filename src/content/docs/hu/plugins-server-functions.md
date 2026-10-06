---
title: Szerver függvények
description: Alkalmazás szerver oldali logika írása – functions.js/ts struktúra, context API, adatbázis hozzáférés, hibakezelés
---

## Áttekintés

Az alkalmazás szerver oldali logikája a `server/functions.js` (vagy `.ts`) fájlban él. Ezek a függvények a szerveren futnak, és a kliensről a `sdk.remote.call()` segítségével hívhatók.

Szükséges jogosultság: `remote_functions` a `manifest.json`-ban.

:::tip
Időzítetten, felhasználó nélkül futó kódhoz (napi emlékeztető, lezárások) lásd: [Ütemezett feladatok](/hu/plugins-scheduler/). Ezek a `server/jobs.ts`-ben vannak, nem itt.
:::

## Alapstruktúra

```javascript
// server/functions.js

/**
 * Szerver idő lekérdezése
 * @param {Object} params - Kliens által küldött paraméterek
 * @param {Object} context - Execution context (pluginId, userId, db)
 */
export async function getServerTime(params, context) {
  const now = new Date();
  return {
    iso: now.toISOString(),
    locale: now.toLocaleString('hu-HU'),
    timestamp: now.getTime()
  };
}
```

TypeScript-tel:

```typescript
// server/functions.ts

interface Context {
  pluginId: string;
  userId: string;
  db: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
    connect: () => Promise<{
      query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
      release: () => void;
    }>;
  };
  permissions: string[];
  pluginPermissions: string[];
  email?: { send: (params: unknown) => Promise<{ success: boolean; error?: string }> };
}

export async function getServerTime(
  params: { format?: 'ISO' | 'locale' | 'timestamp' },
  context: Context
) {
  const now = new Date();
  return {
    iso: now.toISOString(),
    locale: now.toLocaleString('hu-HU'),
    timestamp: now.getTime()
  };
}
```

## A `context` objektum

Minden szerver függvény megkapja a `context` paramétert:

| Mező | Típus | Leírás |
|---|---|---|
| `pluginId` | `string` | A plugin azonosítója |
| `userId` | `string` | A hívó felhasználó ID-ja (numerikus string, pl. `"12"`) |
| `db` | `object` | pg Pool kompatibilis kapcsolat: `query(sql, params)` és `connect()` tranzakciókhoz |
| `permissions` | `string[]` | A **hívó felhasználó** core jogosultságai (pl. `plugin.manual.install`). Rendszergazda esetén tartalmazza az `admin` értéket is. |
| `pluginPermissions` | `string[]` | A plugin `manifest.json`-ban megadott jogosultságai (pl. `database`, `remote_functions`) |
| `email` | `object \| undefined` | Email szolgáltatás (csak `notifications` jogosultsággal) — lásd [Email szolgáltatás](/hu/plugins-email/) |
| `files` | `object \| undefined` | Fájltárolás (csak `file_access` jogosultsággal) — lásd [Fájltárolás](/hu/plugins-files/) |

:::note
A `permissions` mező a felhasználóé, nem a pluginé. Ha azt akarod ellenőrizni, hogy a hívó rendszergazda-e, a `context.permissions.includes('admin')` a megfelelő. A plugin saját jogosultságait a `pluginPermissions` mezőben találod.
:::

```javascript
export async function myFunction(params, context) {
  const { pluginId, userId, db } = context;

  console.log(`[${pluginId}] Called by user: ${userId}`);
  // ...
}
```

## Adatbázis hozzáférés

A `db` objektum a core PostgreSQL kapcsolat-poolját adja. A plugin saját táblái az `app__{plugin_id}` sémában vannak (a kötőjelek aláhúzásra cserélve, pl. `my-app` → `app__my_app`). A séma csak `database` jogosultsággal jön létre telepítéskor.

```javascript
export async function getItems(params, context) {
  const { db, pluginId } = context;

  // A plugin saját sémájában lévő tábla lekérdezése
  const result = await db.query(`
    SELECT id, name, created_at
    FROM plugin_${pluginId}.items
    WHERE active = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [true, params.limit ?? 20]);

  return {
    items: result.rows,
    total: result.rows.length
  };
}
```

:::caution
A szerver függvényekben kapott `db` **nincs sémára korlátozva** — ez a kliens oldali `sdk.data.query()`-től eltér, ahol a core kikényszeríti a saját sémát. A házirend: a plugin csak a saját `app__{plugin_id}` sémájába írjon, más plugin sémáját és a `platform.*` táblákat ne érintse. Az `auth.users` olvasása (pl. név, email megjelenítéséhez) elfogadott gyakorlat.
:::

### Tranzakciók

Tranzakcióhoz a `connect()`-tel kérj dedikált klienst, és minden esetben engedd el:

```javascript
export async function transferItems(params, context) {
  const client = await context.db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE app__${context.pluginId.replace(/-/g, '_')}.items SET owner = $1 WHERE id = $2`, [params.to, params.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

## CRUD példa

```javascript
// server/functions.js

export async function createItem(params, context) {
  const { db, pluginId, userId } = context;
  const { name, description } = params;

  if (!name || name.trim().length === 0) {
    throw new Error('A név megadása kötelező');
  }

  const result = await db.query(`
    INSERT INTO plugin_${pluginId}.items (name, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, created_at
  `, [name.trim(), description ?? null, userId]);

  return { item: result.rows[0] };
}

export async function updateItem(params, context) {
  const { db, pluginId } = context;
  const { id, name, description } = params;

  await db.query(`
    UPDATE plugin_${pluginId}.items
    SET name = $1, description = $2, updated_at = NOW()
    WHERE id = $3
  `, [name, description, id]);

  return { success: true };
}

export async function deleteItem(params, context) {
  const { db, pluginId } = context;

  await db.query(`
    DELETE FROM plugin_${pluginId}.items WHERE id = $1
  `, [params.id]);

  return { success: true };
}
```

## Kliens oldali hívás

```svelte
<script lang="ts">
  const sdk = window.webOS!;

  interface Item {
    id: number;
    name: string;
    created_at: string;
  }

  let items = $state<Item[]>([]);
  let loading = $state(false);

  async function loadItems() {
    loading = true;
    try {
      const result = await sdk.remote.call<{ items: Item[] }>('getItems', {
        limit: 50
      });
      items = result.items;
    } catch (error) {
      sdk.ui.toast('Nem sikerült betölteni az elemeket', 'error');
    } finally {
      loading = false;
    }
  }

  async function addItem(name: string) {
    try {
      await sdk.remote.call('createItem', { name });
      sdk.ui.toast('Elem létrehozva', 'success');
      await loadItems();
    } catch (error) {
      sdk.ui.toast((error as Error).message, 'error');
    }
  }
</script>
```

## Hibakezelés

A szerver függvényekből dobott hibák automatikusan propagálódnak a kliensre:

```javascript
export async function riskyOperation(params, context) {
  if (!params.id) {
    throw new Error('Az ID megadása kötelező');
  }

  try {
    const result = await context.db.query(
      `SELECT * FROM plugin_${context.pluginId}.items WHERE id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Az elem nem található');
    }

    return { item: result.rows[0] };
  } catch (error) {
    // Naplózás szerver oldalon
    console.error(`[${context.pluginId}] Error in riskyOperation:`, error);
    // Hiba továbbítása a kliensnek
    throw error;
  }
}
```

A kliensen:

```typescript
try {
  const result = await sdk.remote.call('riskyOperation', { id: 123 });
} catch (error) {
  // error.message tartalmazza a szerver által dobott hibaüzenetet
  sdk.ui.toast(error.message, 'error');
}
```

## Aszinkron műveletek és timeout

A remote hívásoknak alapértelmezetten 30 másodperces timeoutjuk van. Hosszabb műveleteknél adj meg egyedi timeoutot:

```typescript
const result = await sdk.remote.call('longRunningTask', params, {
  timeout: 120000 // 2 perc
});
```

## Standalone fejlesztés mock-olása

A Mock SDK-val szimulálhatod a szerver függvényeket fejlesztés közben:

```typescript
// src/main.ts
MockWebOSSDK.initialize({
  remote: {
    handlers: {
      getItems: async () => ({
        items: [
          { id: 1, name: 'Teszt elem', created_at: new Date().toISOString() }
        ]
      }),
      createItem: async ({ name }) => ({
        item: { id: Date.now(), name, created_at: new Date().toISOString() }
      })
    }
  }
});
```
