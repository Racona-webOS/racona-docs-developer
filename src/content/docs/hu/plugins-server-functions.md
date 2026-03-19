---
title: Szerver függvények
description: Alkalmazás szerver oldali logika írása – functions.js/ts struktúra, context API, adatbázis hozzáférés, hibakezelés
---

## Áttekintés

Az alkalmazás szerver oldali logikája a `server/functions.js` (vagy `.ts`) fájlban él. Ezek a függvények a szerveren futnak, és a kliensről a `sdk.remote.call()` segítségével hívhatók.

Szükséges jogosultság: `remote_functions` a `manifest.json`-ban.

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
    execute: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
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
| `userId` | `string` | A hívó felhasználó ID-ja |
| `db` | `object` | Adatbázis kapcsolat (csak `database` jogosultsággal) |

```javascript
export async function myFunction(params, context) {
  const { pluginId, userId, db } = context;

  console.log(`[${pluginId}] Called by user: ${userId}`);
  // ...
}
```

## Adatbázis hozzáférés

A `db` objektum a plugin saját sémájához (`plugin_{plugin_id}`) biztosít hozzáférést. Szükséges jogosultság: `database`.

```javascript
export async function getItems(params, context) {
  const { db, pluginId } = context;

  // A plugin saját sémájában lévő tábla lekérdezése
  const result = await db.execute(`
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
Csak a plugin saját sémájában (`plugin_{plugin_id}`) lévő táblák érhetők el. A `platform`, `auth` és más pluginok sémái nem elérhetők — ez biztonsági korlát.
:::

## CRUD példa

```javascript
// server/functions.js

export async function createItem(params, context) {
  const { db, pluginId, userId } = context;
  const { name, description } = params;

  if (!name || name.trim().length === 0) {
    throw new Error('A név megadása kötelező');
  }

  const result = await db.execute(`
    INSERT INTO plugin_${pluginId}.items (name, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, created_at
  `, [name.trim(), description ?? null, userId]);

  return { item: result.rows[0] };
}

export async function updateItem(params, context) {
  const { db, pluginId } = context;
  const { id, name, description } = params;

  await db.execute(`
    UPDATE plugin_${pluginId}.items
    SET name = $1, description = $2, updated_at = NOW()
    WHERE id = $3
  `, [name, description, id]);

  return { success: true };
}

export async function deleteItem(params, context) {
  const { db, pluginId } = context;

  await db.execute(`
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
    const result = await context.db.execute(
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
