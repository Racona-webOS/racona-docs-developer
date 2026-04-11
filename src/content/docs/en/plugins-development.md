---
title: Plugin development
description: ElyOS plugin development – project creation, standalone development with Mock SDK, testing in a running ElyOS instance, deployment
---

## Creating a project

The fastest way to start a new plugin project is the `@elyos-dev/create-app` CLI:

```bash
bunx @elyos-dev/create-app
```

The wizard walks you through the setup:

1. **App ID** — kebab-case identifier (e.g. `my-app`)
2. **Display Name** — human-readable name shown in ElyOS
3. **Description** — short description
4. **Author** — your name and email
5. **Features** — pick the features you need
6. **Install dependencies?** — automatically runs `bun install`

### Available features

| Feature | What it adds |
|---|---|
| `sidebar` | Sidebar navigation (`menu.json`, `AppLayout` mode, multiple page components) |
| `database` | SQL migrations, `sdk.data.query()` support, local dev database via Docker |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, local dev server |
| `notifications` | `sdk.notifications.send()` support |
| `i18n` | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` support |
| `datatable` | DataTable component with insert form, row actions (duplicate/delete), full i18n |

:::note
Selecting `database` automatically enables `remote_functions` as well, since database access goes through server-side functions.
:::

### Generated project structure

The structure depends on the selected features. Full example (all features enabled):

```
my-app/
├── manifest.json          # App metadata and permissions
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (if sidebar)
├── build-all.js           # (if sidebar)
├── dev-server.ts          # (if remote_functions)
├── docker-compose.dev.yml # (if database)
├── .env.example           # (if database)
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── plugin.ts
│   └── components/        # (if sidebar)
│       ├── Overview.svelte
│       ├── Settings.svelte
│       ├── Datatable.svelte     # (if datatable)
│       ├── Notifications.svelte # (if notifications)
│       └── Remote.svelte        # (if remote_functions)
├── server/                # (if remote_functions)
│   └── functions.ts
├── migrations/            # (if database)
│   ├── 001_init.sql
│   └── dev/
│       └── 000_auth_seed.sql
├── locales/               # (if i18n)
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

---

## Development workflow

The available scripts depend on the selected features.

### Base scripts (every project)

```bash
bun dev              # Vite dev server (standalone, Mock SDK) — http://localhost:5174
bun run build        # Build IIFE bundle (dist/index.iife.js)
bun run build:watch  # Build in watch mode
bun run package      # Create .elyospkg package
```

### When `remote_functions` is enabled

```bash
bun run dev:server  # Start dev server — http://localhost:5175
```

`dev:server` starts a Bun HTTP server that:
- Serves static files from `dist/` and the project root (with CORS headers)
- Exposes a `POST /api/remote/:functionName` endpoint for calling functions from `server/functions.ts`

### When `database` is also enabled

```bash
bun db:up           # Start Docker Postgres container
bun db:down         # Stop Docker Postgres container
bun run dev:full    # dev:server + dev in parallel (single terminal)
```

`dev:full` starts both the Vite dev server (`5174`) and the dev server (`5175`) at the same time, so you don't need two terminals.

:::note
In database mode, `dev:server` automatically runs migrations on startup — first the files in `migrations/dev/` (auth seed), then the `migrations/` files in order. If the database is unreachable, the server exits with an error.
:::

### First run with database

```bash
cp .env.example .env   # Set environment variables
bun db:up              # Start Postgres container (Docker required)
bun run dev:full       # Dev server + Vite together
```

`.env.example` contains the default connection URL for the database started by Docker Compose:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/{plugin_id}_dev
PORT=5175
DEV_USER_ID=dev-user
```

---

## Standalone development (Mock SDK)

Your app can be developed without a running ElyOS instance. The `@elyos-dev/sdk/dev` package provides a Mock SDK that simulates all SDK services:

| SDK service | Mock behavior |
|---|---|
| `ui.toast()` | Writes to `console.log` |
| `ui.dialog()` | Uses `window.confirm` / `window.prompt` |
| `data.set/get/delete()` | Uses `localStorage` (under `devapp:{appId}:` key prefix) |
| `data.query()` | Returns an empty array |
| `remote.call()` | Configurable mock handler |
| `i18n.t()` | Reads from the provided translations map |
| `notifications.send()` | Writes to `console.log` |

:::note
When loaded inside ElyOS, `ui.toast()` uses the core Sonner toast system, `ui.dialog()` uses the core dialog component, and `notifications.send()` shows a toast (for dev apps not registered in the database). `data.set/get/delete()` calls in dev mode also write to `localStorage` (under the `devapp:{appId}:` prefix), since the dev app is not registered in the database.
:::

### Starting the dev server

```bash
bun dev
```

The Vite dev server starts at `http://localhost:5174`. Hot reload automatically refreshes the browser on every save.

If `remote_functions` is also enabled, you need to run `bun run dev:server` in parallel alongside `bun dev` (or use `bun run dev:full` if `database` is also enabled).

:::note
If `http://localhost:5174` returns a 404, check that there is an `index.html` in the project root. Projects generated by the CLI include this automatically.
:::

### Mock SDK initialization

The Mock SDK is initialized automatically in `src/main.ts`:

```typescript
// src/main.ts
import { MockWebOSSDK } from '@elyos-dev/sdk/dev';
import App from './App.svelte';
import { mount } from 'svelte';

// Only runs when NOT inside ElyOS
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

All `initialize()` configuration options:

| Option | Type | Description |
|---|---|---|
| `i18n.locale` | `string` | Default locale (e.g. `'en'`) |
| `i18n.translations` | `Record<string, Record<string, string>>` | Translation keys per locale |
| `context.pluginId` | `string` | Simulated app ID |
| `context.user` | `UserInfo` | Simulated logged-in user |
| `context.permissions` | `string[]` | Simulated permissions |
| `data.initialData` | `Record<string, unknown>` | Pre-populated localStorage data |
| `remote.handlers` | `Record<string, Function>` | Mock server function handlers |
| `assets.baseUrl` | `string` | Asset URL prefix |

When ElyOS loads the app in production, `window.webOS` already exists, so the `if (!window.webOS)` guard prevents the Mock SDK from running.

### Mocking remote calls

To test server functions in standalone mode:

```typescript
MockWebOSSDK.initialize({
  remote: {
    handlers: {
      getServerTime: async () => ({
        iso: new Date().toISOString(),
        locale: new Date().toLocaleString('en-US')
      }),
      calculate: async ({ a, b, operation }) => {
        if (operation === 'add') return { result: a + b };
        throw new Error('Unsupported operation');
      }
    }
  }
});
```

### Dev server port configuration

`dev:server` defaults to port `5175` (the Vite dev server uses `5174`). If you're developing multiple apps at the same time, the port can be overridden via the `PORT` environment variable in `.env` or directly:

```bash
PORT=5176 bun run dev:server
```

Enter the corresponding URL in the ElyOS Dev Apps loader: `http://localhost:5176`.

---

## Testing inside a running ElyOS

Standalone dev mode (Mock SDK) only tests the UI. To test real SDK calls, database access, or server functions, you need to load the app into a running ElyOS instance.

The idea: **build the app, start a static HTTP server (`dev:server`), then load it into ElyOS by URL.** There is no automatic hot reload — if you change the code, you need to rebuild and reopen the app window.

:::note[Ports]
- `5174` — Vite dev server (`bun dev`) — standalone development with Mock SDK
- `5175` — Plugin dev server (`bun run dev:server`) — loading into ElyOS with the real SDK
:::

### Step 1 — Start ElyOS core

In the `elyos-core` monorepo root:

```bash
# Enable dev app loading in .env.local:
# DEV_MODE=true

bun app:dev
```

ElyOS is available at `http://localhost:5173` by default. Log in with an admin account.

### Step 2 — Build the app

In the app project directory:

```bash
bun run build
```

This creates `dist/index.iife.js` — the file ElyOS loads.

### Step 3 — Start the plugin dev server

```bash
bun run dev:server
```

This starts the `dev-server.ts` Bun HTTP server at `http://localhost:5175`. It serves files from `dist/` and the project root with CORS headers.

If `database` is also enabled, the server automatically runs migrations on startup, and `server/functions.ts` functions are accessible via `POST /api/remote/:functionName`.

:::note
`dev:server` only serves static files — no hot reload, no Vite. If you changed the code, run `bun run build` again, then close and reopen the app window in ElyOS.
:::

### Step 4 — Load the app into ElyOS

:::caution[Prerequisites]
The "Dev Apps" menu item only appears in the App Manager if:
- `DEV_MODE=true` is set in the ElyOS `.env.local` file
- The logged-in user has the `app.manual.install` permission (admin accounts have this by default)
:::

1. Open ElyOS in the browser
2. Start menu → App Manager
3. Click **"Dev Apps"** in the left sidebar
4. A URL input field appears with `http://localhost:5175` as the default value
5. Click **"Load"**

ElyOS fetches `manifest.json` from the dev server, then loads the IIFE bundle and registers the app as a Web Component.

:::tip[Running ElyOS in Docker?]
If ElyOS is running in a Docker container (e.g. started with `bun docker:up`), the container cannot reach the host machine's `localhost`. Use `host.docker.internal` instead:

```
http://host.docker.internal:5175
```

The server-side validation accepts this address, and the browser automatically receives `localhost` back in the URL — so the plugin loads correctly from both sides.
:::

### Reloading after changes

```bash
# 1. Rebuild
bun run build

# 2. In ElyOS: close the app window, then reopen it
#    (no need to click "Load" again — the app is already in the list)
```

### Full dev workflow summary

**Basic (without remote_functions):**

```bash
# Terminal 1 — ElyOS core
cd elyos-core && bun app:dev

# Terminal 2 — App build + server
cd my-app
bun run build       # Build IIFE bundle
bun run dev:server  # Start static server (http://localhost:5175)

# In ElyOS: App Manager → Dev Apps → Load → http://localhost:5175
```

**With database (database + remote_functions):**

```bash
# Terminal 1 — ElyOS core
cd elyos-core && bun app:dev

# Terminal 2 — App (first time)
cd my-app
cp .env.example .env   # Set DATABASE_URL and PORT
bun db:up              # Start Postgres container

# Terminal 2 — App (every time)
bun run build          # Build IIFE bundle
bun run dev:server     # Dev server + migrations + remote endpoint (http://localhost:5175)

# In ElyOS: App Manager → Dev Apps → Load → http://localhost:5175
```

---

## Installing a plugin (`.elyospkg`)

Once your app is ready, package it and install it into ElyOS.

### Creating the package

```bash
bun run build    # Build IIFE bundle
bun run package  # Create .elyospkg file
```

This creates a `{id}-{version}.elyospkg` file (e.g. `my-app-1.0.0.elyospkg`). The package is a ZIP archive containing:

- `manifest.json`
- `dist/` — build output (IIFE bundle)
- `locales/` — translations (if present)
- `assets/` — static files (if present)
- `menu.json` — sidebar configuration (if present)
- `server/` — server-side functions (if present)
- `migrations/` — database migrations (if present, without dev seed files)

### Uploading to ElyOS

1. Start menu → App Manager → **Plugin Upload**
2. Drag and drop the `.elyospkg` file, or click the browse button
3. ElyOS validates the package and shows a preview
4. Click **Install**

During installation, ElyOS:
- Extracts files to the plugin storage directory
- Registers the app in the app registry
- Imports translations (if `locales/` is present)
- Creates the plugin database schema (if `database` permission is declared)
- Registers email templates (if `notifications` permission is declared)

:::caution
Uploading a plugin requires the `plugin.manual.install` permission (admin accounts have this by default).
:::

---

## Manifest file

`manifest.json` contains the app metadata. Required and optional fields:

```json
{
  "id": "my-app",
  "name": { "hu": "Alkalmazásom", "en": "My App" },
  "version": "1.0.0",
  "description": { "hu": "Rövid leírás", "en": "Short description" },
  "author": "Your Name <email@example.com>",
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

### Permissions

| Permission | Description | SDK functions |
|---|---|---|
| `database` | Database access | `data.set()`, `data.get()`, `data.query()` |
| `notifications` | Send notifications | `notifications.send()` |
| `remote_functions` | Server-side functions | `remote.call()` |
| `file_access` | File access | (planned) |
| `user_data` | User data | (planned) |

### ID format rules

- Lowercase letters, numbers and hyphens only (`kebab-case`)
- Minimum 3, maximum 50 characters
- Regex: `^[a-z0-9-]+$`

```json
"id": "my-app"    // ✅ Valid
"id": "MyApp"     // ❌ Invalid
"id": "my_app"    // ❌ Invalid
```

---

## WebOS SDK API

The SDK is available via the `window.webOS` global object:

```typescript
const sdk = window.webOS!;
```

### UI Service

```typescript
// Toast notification
sdk.ui.toast('Message', 'success');
// type: 'info' | 'success' | 'warning' | 'error'

// Dialog
const result = await sdk.ui.dialog({
  title: 'Title',
  message: 'Message',
  type: 'confirm' // 'info' | 'confirm' | 'prompt'
});
```

### Remote Service

```typescript
// Call a server function
const result = await sdk.remote.call('functionName', { param: 'value' });

// With a generic return type
const result = await sdk.remote.call<MyResult>('functionName', params);
```

### Data Service

```typescript
// Key-value storage
await sdk.data.set('key', { value: 123 });
const value = await sdk.data.get('key');
await sdk.data.delete('key');

// SQL query (plugin's own schema only!)
const rows = await sdk.data.query('SELECT * FROM my_table WHERE id = $1', [123]);

// Transaction
await sdk.data.transaction(async (tx) => {
  await tx.query('INSERT INTO ...');
  await tx.query('UPDATE ...');
  await tx.commit();
});
```

### I18n Service

```typescript
// Translation
const text = sdk.i18n.t('key');

// With parameters
const text = sdk.i18n.t('welcome', { name: 'John' });

// Current locale
const locale = sdk.i18n.locale; // 'hu' | 'en'

// Switch locale
await sdk.i18n.setLocale('en');
```

### Notification Service

```typescript
await sdk.notifications.send({
  userId: 'user-123',
  title: 'Title',
  message: 'Message',
  type: 'info' // 'info' | 'success' | 'warning' | 'error'
});
```

### Context Service

```typescript
const pluginId = sdk.context.pluginId;
const user = sdk.context.user;
const permissions = sdk.context.permissions;

// Window controls
sdk.context.window.close();
sdk.context.window.setTitle('New title');
```

### Asset Service

```typescript
const iconUrl = sdk.assets.getUrl('icon.svg');
const imageUrl = sdk.assets.getUrl('images/logo.png');
```

---

## TypeScript and autocomplete

`@elyos-dev/sdk` ships with full TypeScript type definitions. The `window.webOS` type is available automatically:

```typescript
// Automatic type — no import needed
const sdk = window.webOS!;

sdk.ui.toast('Hello!', 'success');       // ✅ autocomplete
sdk.data.set('key', { value: 123 });     // ✅ type checking
sdk.remote.call<MyResult>('fn', params); // ✅ generic return type
```

Explicit type import when needed:

```typescript
import type { WebOSSDKInterface, UserInfo } from '@elyos-dev/sdk/types';

const user: UserInfo = sdk.context.user;
```

---

## Svelte 5 runes in plugins

Plugins use Svelte 5 runes-based reactivity. The `runes: true` compiler option is enabled in `vite.config.ts`:

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
Plugins **cannot** use SvelteKit-specific imports (`$app/navigation`, `$app/stores`, etc.) — those are only available in the host application.
:::

---

## Server-side functions

When `remote_functions` is enabled, server-side functions are defined in `server/functions.ts`:

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

Calling from the client:

```typescript
const result = await sdk.remote.call('getItems', { page: 1, pageSize: 20 });
```

---

## Database migrations

When `database` is enabled, SQL files in the `migrations/` directory define the plugin's own database schema. Files run in alphabetical order (e.g. `001_init.sql`, `002_add_column.sql`).

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
Table names do not need a schema prefix in migration files — ElyOS automatically adds the `app__{plugin_id}` prefix during installation.
:::

Files in `migrations/dev/` are for development only (e.g. seed data) and are excluded from the `.elyospkg` package.

---

## Styling

### CSS injection

Plugin CSS is automatically bundled into the JS output during the IIFE build via `vite-plugin-css-injected-by-js`. This plugin is already included in the `vite.config.ts` generated by `create-elyos-app` — no manual setup needed.

### Specificity conflicts

The core app's Tailwind styles (base layer resets) can override plugin styles. Svelte scoped CSS generates `button.svelte-xxxx` selectors, but Tailwind's `button { ... }` reset loads with higher specificity.

The fix: always scope your styles inside a container class:

```svelte
<!-- ❌ Bad — core styles will override -->
<style>
  button { border: 1px solid #ccc; }
</style>

<!-- ✅ Good — scoped inside a container class -->
<style>
  .my-plugin button { border: 1px solid #ccc; }
</style>
```

If core styles override an element, `all: revert` restores the browser's native style:

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

### Summary

| Rule | Why |
|---|---|
| Scope inside a container class (`.my-plugin button`) | Core Tailwind styles override bare tag selectors |
| Use `all: revert` when needed | Restores the browser's native style |
| Give the root container a unique class name | Avoids conflicts with other plugins' styles |

---

## Security rules

### Forbidden

- `eval()` and `Function()` constructor
- `innerHTML` and `document.write()`
- fetch/XHR to external domains
- Dynamic import from external URLs
- Accessing other plugins' schemas
- Accessing system schemas (`platform`, `auth`, `public`)

### Allowed dependencies

Only whitelisted packages may appear in the manifest `dependencies` field:

- `svelte` (^5.x.x)
- `@lucide/svelte` / `lucide-svelte`
- `phosphor-svelte`
- `@elyos/*` and `@elyos-dev/*` (any version)

---

## Common errors

| Error | Solution |
|---|---|
| `"Invalid plugin ID format"` | Use kebab-case: `my-plugin` |
| `"Permission denied"` | Add the required permission to `manifest.json` |
| `"Module not found"` | Run `bun run build` first |
| `"Plugin already exists"` | A plugin with that ID is already installed — uninstall it first |
| `"Plugin is inactive"` | The plugin is in inactive state — activate it in the App Manager |
| Dev app not showing up | Check that `DEV_MODE=true` is set in the ElyOS `.env.local` |
