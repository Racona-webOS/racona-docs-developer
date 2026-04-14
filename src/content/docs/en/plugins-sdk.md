---
title: SDK API Reference
description: Detailed documentation of all WebOS SDK services – ui, data, remote, i18n, notifications, context, assets
---

The WebOS SDK is accessible via the `window.webOS` global object. In Racona, the runtime SDK initializes automatically — for standalone development, use the Mock SDK (see [Developer Workflow](/en/plugins-development/)).

```typescript
const sdk = window.webOS!;
```

## UI Service — `sdk.ui`

### `toast(message, type?, duration?)`

Display a toast notification.

```typescript
sdk.ui.toast('Saved!', 'success');
sdk.ui.toast('An error occurred', 'error');
sdk.ui.toast('Warning', 'warning', 5000);
sdk.ui.toast('Information', 'info');
```

| Parameter | Type | Description |
|---|---|---|
| `message` | `string` | Text to display |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | Toast type (default: `'info'`) |
| `duration` | `number` | Display time in ms (default: 3000) |

### `dialog(options)`

Display a modal dialog. In Racona, the core uses its own dialog component — not `window.alert/confirm/prompt`.

```typescript
// Request confirmation
const result = await sdk.ui.dialog({
  title: 'Confirm Deletion',
  message: 'Are you sure you want to delete this?',
  type: 'confirm'
});

if (result.action === 'confirm') {
  // delete...
}

// Request text input
const result = await sdk.ui.dialog({
  title: 'New Item Name',
  message: 'Enter the name:',
  type: 'prompt'
});

if (result.action === 'submit') {
  console.log(result.value); // the entered text
}

// Display information
await sdk.ui.dialog({
  title: 'Done',
  message: 'The operation completed successfully.',
  type: 'info'
});
```

The return value is always a `DialogResult`:

| `action` value | When | `value` |
|---|---|---|
| `'ok'` | Info dialog closed | — |
| `'confirm'` | Confirm dialog → Confirmed | — |
| `'cancel'` | Any dialog → Cancel / ESC | — |
| `'submit'` | Prompt dialog → Submit | the entered text |

### `theme`

The current theme colors.

```typescript
const colors = sdk.ui.theme;
console.log(colors.primary);    // e.g. '#667eea'
console.log(colors.background); // e.g. '#ffffff'
```

### `components`

Racona UI components (Button, Input, Card, etc.) — these are the host application's components, also available to the plugin.

```typescript
const { Button, Input, Card } = sdk.ui.components;
```

---

## Data Service — `sdk.data`

Key-value storage and SQL queries within the plugin's own schema. Required permission: `database`.

### Database Schema on Installation

If the `"database"` permission is listed in the plugin's `manifest.json`, the installer automatically creates a dedicated PostgreSQL schema for the plugin:

```
plugin_{plugin_id}
```

For example, the schema for the `my-plugin` plugin is: `plugin_my_plugin` (hyphens are replaced with underscores).

The schema includes a `kv_store` table by default (for `set/get/delete` operations) and a `migrations` tracking table. If the plugin does not request `database` permission, no schema is created.

### Migrations (`migrations/` folder)

If the plugin needs its own table structure (e.g. `notes`, `items`, etc.), you can place SQL files in the `migrations/` folder. The installer runs them in alphabetical order and tracks which migrations have already been applied.

**Naming convention:** `001_init.sql`, `002_add_column.sql`, etc.

```sql
-- migrations/001_init.sql
-- The installer automatically prefixes table names with the plugin schema
-- (e.g. notes → plugin_my_plugin.notes)

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
You don't need to write the schema prefix (`plugin_my_plugin.notes`) — the installer adds it automatically. If you do include it, the installer won't duplicate it.
:::

**Error handling:** If a migration SQL is syntactically invalid or fails at runtime, the entire plugin installation will fail and a rollback will occur. The error message includes the filename and the database error message.

The `migrations/` folder is automatically packaged into the `.elyospkg` by `build-package.js` if it exists.

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

SQL query within the plugin's own schema (`plugin_{plugin_id}`). Only tables in the plugin's own schema are accessible.

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
Only tables in the plugin's own schema (`plugin_{id}`) are accessible. The `platform`, `auth`, and other plugin schemas are not accessible.
:::

### `transaction(callback)`

Execute a transaction.

```typescript
await sdk.data.transaction(async (tx) => {
  await tx.query('INSERT INTO items (name) VALUES ($1)', ['New item']);
  await tx.query('UPDATE counters SET value = value + 1');
  await tx.commit();
});
```

---

## Remote Service — `sdk.remote`

Call server-side functions. Required permission: `remote_functions`.

### `call<T>(functionName, params?, options?)`

```typescript
// Simple call
const time = await sdk.remote.call<{ iso: string }>('getServerTime');

// With parameters
const result = await sdk.remote.call<{ result: number }>('calculate', {
  a: 10,
  b: 5,
  operation: 'add'
});

// With timeout
const data = await sdk.remote.call('fetchData', { page: 1 }, { timeout: 10000 });
```

Server functions are defined in the plugin's `server/functions.js` (or `.ts`) file. Details: [Server Functions](/en/plugins-server-functions/).

**Automatic features:**
- 3x retry with exponential backoff
- Automatic auth token attachment
- Timeout handling (default: 30 seconds)

---

## I18n Service — `sdk.i18n`

Translation management. Translation files are located in the `locales/` folder.

### `t(key, params?)`

```typescript
// Simple translation
const label = sdk.i18n.t('save');

// With parameters
const greeting = sdk.i18n.t('welcome', { name: 'John Smith' });
// locales/en.json: { "welcome": "Welcome, {name}!" }
```

### `locale`

The current language ISO code.

```typescript
const lang = sdk.i18n.locale; // 'hu' | 'en'
```

### `setLocale(locale)`

Switch language.

```typescript
await sdk.i18n.setLocale('en');
```

### `ready()`

Wait for translations to load.

```typescript
await sdk.i18n.ready();
const text = sdk.i18n.t('title');
```

---

## Notification Service — `sdk.notifications`

Send system notifications. Required permission: `notifications`.

### `send(options)`

```typescript
await sdk.notifications.send({
  userId: 'user-123',
  title: 'Task Complete',
  message: 'The export completed successfully.',
  type: 'success'
});
```

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | The target user's ID |
| `title` | `string` | Notification title |
| `message` | `string` | Notification body |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | Notification type |

---

## Context Service — `sdk.context`

The plugin and user context.

### `pluginId`

```typescript
const id = sdk.context.pluginId; // e.g. 'my-plugin'
```

### `user`

```typescript
const user = sdk.context.user;
console.log(user.id);     // user ID
console.log(user.name);   // display name
console.log(user.email);  // email address
console.log(user.roles);  // ['admin', 'user', ...]
console.log(user.groups); // list of groups
```

### `params`

Parameters passed when the plugin was opened.

```typescript
const params = sdk.context.params;
// e.g. { itemId: '123', mode: 'edit' }
```

### `permissions`

The list of permissions granted to the plugin.

```typescript
const perms = sdk.context.permissions;
// e.g. ['database', 'remote_functions']

if (perms.includes('notifications')) {
  // send notification...
}
```

### `window.setTitle(title)`

Modify the window title.

```typescript
sdk.context.window.setTitle('My Plugin — Settings');
```

### `window.close()`

Close the window.

```typescript
sdk.context.window.close();
```

---

## Asset Service — `sdk.assets`

Generate URLs for plugin assets.

### `getUrl(assetPath)`

```typescript
const iconUrl = sdk.assets.getUrl('icon.svg');
const imageUrl = sdk.assets.getUrl('images/banner.png');
```

Usage in a Svelte template:

```svelte
<img src={sdk.assets.getUrl('logo.png')} alt="Logo" />
```

---

## Error Handling

Remote calls and database operations can throw errors. Always use try-catch:

```typescript
try {
  const result = await sdk.remote.call('myFunction', params);
  sdk.ui.toast('Success!', 'success');
} catch (error) {
  // Possible error codes:
  // PLUGIN_NOT_FOUND, PLUGIN_INACTIVE
  // PERMISSION_DENIED
  // REMOTE_CALL_TIMEOUT
  // NETWORK_ERROR, SERVER_ERROR

  sdk.ui.toast('An error occurred', 'error');
  console.error(error);
}
```
