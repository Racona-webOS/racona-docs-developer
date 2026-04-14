---
title: "@racona/cli"
description: The Racona CLI tool for scaffolding new application projects with a single command
next:
  link: /en/plugins/
  label: Application development
---

`@racona/cli` is an interactive CLI tool that lets you create a fully configured Racona application project in seconds. No need to manually set up Vite, TypeScript, the Mock SDK, or build scripts — the CLI handles everything.

```bash
bunx @racona/cli
```

The wizard walks you through the basic settings (app ID, name, author) and then lets you pick the **features** you want. The project is generated based on your selection — no fixed templates.

## Feature selection

After entering the app metadata, the CLI asks which features to include:

| Feature | What it adds |
|---|---|
| `sidebar` | Sidebar navigation (`menu.json`, `AppLayout` mode, multiple page components) |
| `database` | SQL migrations (`migrations/001_init.sql`), `sdk.data.query()` support |
| `remote_functions` | Server-side functions (`server/functions.ts`), `sdk.remote.call()` support |
| `notifications` | `sdk.notifications.send()` support, `notifications` permission |
| `i18n` | Translation files (`locales/hu.json`, `locales/en.json`), `sdk.i18n.t()` support |
| `datatable` | DataTable component with insert form, row actions (duplicate/delete), full i18n |

:::note
`database` requires `remote_functions` — if you select `database`, `remote_functions` is automatically included.
:::

## Generated project

The generated structure depends on the selected features. A project with all features enabled:

```
my-app/
├── manifest.json          # App metadata and permissions
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (if sidebar)
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── plugin.ts
│   └── components/        # (if sidebar)
│       ├── Overview.svelte
│       ├── Settings.svelte
│       ├── Datatable.svelte   # (if datatable)
│       ├── Notifications.svelte # (if notifications)
│       └── Remote.svelte      # (if remote_functions)
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

## Datatable feature

When `datatable` + `database` + `remote_functions` are all enabled, the generated `Datatable.svelte` includes:

- A data table loaded via `sdk.data.query()`
- An **insert form** below the table (`name` + `value` fields)
- **Row actions**: Duplicate (primary) and Delete (secondary, destructive) — delete uses `sdk.ui.dialog()` confirm modal
- Full i18n support via `t()` calls

The generated `server/functions.ts` exports `example`, `insertItem`, `deleteItem`, and `duplicateItem` — all scoped to the plugin's own `app__<id>` database schema.

## Related

- [Getting Started](/en/plugins-getting-started/) — detailed guide on using the CLI and the generated project structure
