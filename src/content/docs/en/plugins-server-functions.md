---
title: Server Functions
description: Writing server-side logic for applications – functions.js/ts structure, context API, database access, error handling
---

## Overview

The application's server-side logic lives in the `server/functions.js` (or `.ts`) file. These functions run on the server and can be called from the client using `sdk.remote.call()`.

Required permission: `remote_functions` in `manifest.json`.

:::tip
For code that runs on a schedule, without a user (daily reminders, closing items), see [Scheduled Jobs](/en/plugins-scheduler/). It lives in `server/jobs.ts`, not here.
:::

## Basic Structure

```javascript
// server/functions.js

/**
 * Get server time
 * @param {Object} params - Parameters sent by the client
 * @param {Object} context - Execution context (pluginId, userId, db)
 */
export async function getServerTime(params, context) {
  const now = new Date();
  return {
    iso: now.toISOString(),
    locale: now.toLocaleString('en-US'),
    timestamp: now.getTime()
  };
}
```

With TypeScript:

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
    locale: now.toLocaleString('en-US'),
    timestamp: now.getTime()
  };
}
```

## The `context` Object

Every server function receives the `context` parameter:

| Field | Type | Description |
|---|---|---|
| `pluginId` | `string` | The plugin identifier |
| `userId` | `string` | The ID of the calling user (numeric string, e.g. `"12"`) |
| `db` | `object` | pg Pool compatible connection: `query(sql, params)` and `connect()` for transactions |
| `permissions` | `string[]` | The **calling user's** core permissions (e.g. `plugin.manual.install`). For system administrators it also contains `admin`. |
| `pluginPermissions` | `string[]` | The permissions declared in the plugin's `manifest.json` (e.g. `database`, `remote_functions`) |
| `email` | `object \| undefined` | Email service (only with `notifications` permission) — see [Email Service](/en/plugins-email/) |
| `files` | `object \| undefined` | File storage (only with `file_access` permission) — see [File Storage](/en/plugins-files/) |

:::note
`permissions` belongs to the user, not the plugin. To check whether the caller is a system administrator, use `context.permissions.includes('admin')`. The plugin's own permissions are in `pluginPermissions`.
:::

```javascript
export async function myFunction(params, context) {
  const { pluginId, userId, db } = context;

  console.log(`[${pluginId}] Called by user: ${userId}`);
  // ...
}
```

## Database Access

The `db` object is the core PostgreSQL connection pool. The plugin's own tables live in the `app__{plugin_id}` schema (hyphens replaced with underscores, e.g. `my-app` → `app__my_app`). The schema is only created at install time when the plugin has the `database` permission.

```javascript
export async function getItems(params, context) {
  const { db, pluginId } = context;

  // Query a table in the plugin's own schema
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
The `db` handed to server functions is **not restricted to a schema** — unlike the client-side `sdk.data.query()`, where the core enforces the plugin's own schema. The policy: write only to your own `app__{plugin_id}` schema and never touch other plugins' schemas or `platform.*` tables. Reading `auth.users` (e.g. to display names and emails) is accepted practice.
:::

### Transactions

For a transaction, acquire a dedicated client with `connect()` and always release it:

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

## CRUD Example

```javascript
// server/functions.js

export async function createItem(params, context) {
  const { db, pluginId, userId } = context;
  const { name, description } = params;

  if (!name || name.trim().length === 0) {
    throw new Error('Name is required');
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

## Client-Side Call

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
      sdk.ui.toast('Failed to load items', 'error');
    } finally {
      loading = false;
    }
  }

  async function addItem(name: string) {
    try {
      await sdk.remote.call('createItem', { name });
      sdk.ui.toast('Item created', 'success');
      await loadItems();
    } catch (error) {
      sdk.ui.toast((error as Error).message, 'error');
    }
  }
</script>
```

## Error Handling

Errors thrown from server functions automatically propagate to the client:

```javascript
export async function riskyOperation(params, context) {
  if (!params.id) {
    throw new Error('ID is required');
  }

  try {
    const result = await context.db.query(
      `SELECT * FROM plugin_${context.pluginId}.items WHERE id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Item not found');
    }

    return { item: result.rows[0] };
  } catch (error) {
    // Log on the server side
    console.error(`[${context.pluginId}] Error in riskyOperation:`, error);
    // Propagate error to the client
    throw error;
  }
}
```

On the client:

```typescript
try {
  const result = await sdk.remote.call('riskyOperation', { id: 123 });
} catch (error) {
  // error.message contains the error message thrown by the server
  sdk.ui.toast(error.message, 'error');
}
```

## Async Operations and Timeout

Remote calls have a default timeout of 30 seconds. For longer operations, specify a custom timeout:

```typescript
const result = await sdk.remote.call('longRunningTask', params, {
  timeout: 120000 // 2 minutes
});
```

## Mocking for Standalone Development

You can simulate server functions during development using the Mock SDK:

```typescript
// src/main.ts
MockWebOSSDK.initialize({
  remote: {
    handlers: {
      getItems: async () => ({
        items: [
          { id: 1, name: 'Test item', created_at: new Date().toISOString() }
        ]
      }),
      createItem: async ({ name }) => ({
        item: { id: Date.now(), name, created_at: new Date().toISOString() }
      })
    }
  }
});
```
