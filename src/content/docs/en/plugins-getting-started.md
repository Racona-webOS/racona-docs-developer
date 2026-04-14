---
title: Creating Your First App
description: Creating an app project with the @racona/cli CLI tool – project structure, manifest, first build
---

## Prerequisites

- [Bun](https://bun.sh) installed (`bun --version` ≥ 1.0)
- A running Racona instance (via Docker or locally) — required for uploading the app and testing within the Racona system (not just standalone mode). See: [Docker-based setup](/en/getting-started#docker-based-setup)

## Creating a Project

Use the Racona CLI to create a new app project:

```bash
bunx @racona/cli
```

The interactive wizard walks you through the setup:

1. **App ID** — kebab-case identifier (e.g. `my-app`)
2. **Display name** — what users see
3. **Description** — short description
4. **Author** — `Name <email>` format
5. **Features** — pick what you need (see below)
6. **Install dependencies?** — runs `bun install` automatically

### Feature selection

Instead of fixed templates, the CLI lets you compose your project from individual features:

| Feature | What it adds |
|---|---|
| `sidebar` | Sidebar navigation (`menu.json`, `AppLayout` mode, multiple page components) |
| `database` | SQL migrations, `sdk.data.query()` support, local dev database via Docker |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, local dev server |
| `notifications` | `sdk.notifications.send()` support |
| `i18n` | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` support |
| `datatable` | DataTable component with insert form, row actions, full i18n |

:::note
`database` requires `remote_functions` — selecting `database` automatically enables `remote_functions`.
:::

## Generated Project Structure

The structure depends on selected features. Example with all features enabled:

```
my-app/
├── manifest.json          # App metadata and permissions (required)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (if sidebar)
├── build-all.js           # (if sidebar) builds main + all components
├── dev-server.ts          # (if remote_functions) local dev server
├── docker-compose.dev.yml # (if database) local Postgres
├── .env.example           # (if database)
├── src/
│   ├── App.svelte         # Main component / sidebar shell
│   ├── main.ts            # Entry point, Mock SDK init
│   ├── plugin.ts          # IIFE build entry
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

## Datatable Feature

When `datatable` + `database` + `remote_functions` are all enabled, the generated `Datatable.svelte` includes:

- A data table loaded via `sdk.data.query()`
- An **insert form** below the table (`name` + `value` fields), styled with core CSS variables
- **Row actions**: Duplicate (primary) and Delete (secondary, destructive) — delete uses `sdk.ui.dialog()` confirm modal
- Full i18n support — all strings use `t()` with translation keys in `locales/`

The generated `server/functions.ts` exports:

```ts
export async function example(params, context) { ... }
export async function insertItem(params, context) { ... }
export async function deleteItem(params, context) { ... }
export async function duplicateItem(params, context) { ... }
```

All functions are scoped to the plugin's own `app__<id>` database schema via `context.pluginId`.

## Sidebar Feature

When `sidebar` is enabled, the app uses `AppLayout` mode — Racona renders a navigation bar on the left side of the app window. The `menu.json` defines the navigation items:

```json
[
  { "labelKey": "menu.overview", "href": "#overview", "icon": "Info", "component": "Overview" },
  { "labelKey": "menu.settings", "href": "#settings", "icon": "Settings", "component": "Settings" }
]
```

Each `component` value maps to a file in `src/components/`.

## Database Feature

When `database` is enabled, the project includes:

- `migrations/001_init.sql` — initial schema (table names are automatically prefixed with `app__<id>` by the Racona installer)
- `migrations/dev/000_auth_seed.sql` — minimal `auth` schema for local development
- `docker-compose.dev.yml` — local Postgres container
- `.env.example` — `DATABASE_URL` and `PORT` configuration

Local development workflow:

```bash
cp .env.example .env
bun db:up          # Start local Postgres
bun dev:server     # Start dev server (runs migrations automatically)
bun dev            # Start Vite dev server (separate terminal)
```

Or in one step:

```bash
bun dev:full       # Runs dev:server + dev in parallel
```

## Installing Dependencies

```bash
cd my-app
bun install
```

## First Build

```bash
bun run build
```

This creates `dist/index.iife.js` (and component bundles if sidebar is enabled) — the files loaded by Racona.

## Next Steps

- [Developer workflow](/en/plugins-development/) — standalone dev mode and Mock SDK
- [manifest.json reference](/en/plugins-manifest/) — all fields in detail
- [Build and upload](/en/plugins-build/) — `.elyospkg` package and installation
