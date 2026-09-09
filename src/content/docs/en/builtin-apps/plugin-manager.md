---
title: Plugin Manager Application
description: Plugin installation, management, and removal
---

The Plugin Manager application allows installing, managing, and removing third-party plugins. It supports manual upload, validation, and detailed display of installed plugins.

## Overview

The Plugin Manager consists of four main parts:
- **Plugin Store** — Plugin marketplace (under development)
- **Installed plugins** — List and management of installed plugins
- **Manual installation** — Upload `.raconapkg` files
- **Dev plugins** — Load developer plugins (dev mode only)

### Main features

- Plugin upload via drag & drop or file browser
- Plugin validation before installation
- List installed plugins with filters
- View plugin details (version, author, permissions, dependencies)
- Plugin removal
- Permission-based access
- Dev mode plugin loading

## File structure

```
apps/plugin-manager/
├── index.svelte              # Main layout (AppLayout + menu)
├── menu.json                 # Menu definition
├── plugins.remote.ts         # Server actions (list, details, removal)
├── components/
│   ├── PluginStore.svelte    # Plugin store (placeholder)
│   ├── PluginList.svelte     # Installed plugins table
│   ├── pluginListColumns.ts  # Table column definitions
│   ├── PluginDetail.svelte   # Plugin details
│   ├── PluginUpload.svelte   # Plugin upload
│   ├── PluginPreview.svelte  # Plugin preview before installation
│   ├── DevPlugins.svelte     # Dev plugins list
│   └── DevPluginLoader.svelte # Dev plugin loader
└── types/
    └── ...                   # Plugin types
```

## Menu structure

```json
[
  {
    "labelKey": "menu.store",
    "href": "#store",
    "icon": "Store",
    "component": "PluginStore"
  },
  {
    "labelKey": "menu.installed",
    "href": "#installed",
    "icon": "Package",
    "component": "PluginList"
  },
  {
    "labelKey": "menu.manualInstall",
    "href": "#upload",
    "icon": "Upload",
    "component": "PluginUpload",
    "requiredPermission": "plugin.manual.install"
  },
  {
    "labelKey": "menu.devPlugins",
    "href": "#dev-plugins",
    "icon": "Code",
    "component": "DevPlugins",
    "requiredPermission": "plugin.manual.install",
    "hideWhen": "notDevMode"
  }
]
```

**Permissions:** `plugin.manual.install` — Plugin upload and removal (admin only)

**Conditional display:** Dev Plugins menu item is only visible in dev mode (`hideWhen: "notDevMode"`)

## Server Actions

### `plugins.remote.ts`

#### 1. `fetchPlugins` (command)

Fetch installed plugins with filtering and pagination.

```typescript
const result = await fetchPlugins({
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc',
  search: 'my-plugin',
  status: 'active'
});
```

**Return value:**

```typescript
{
  success: true,
  data: PluginListItem[],
  pagination: { page, pageSize, totalCount, totalPages }
}
```

#### 2. `fetchPluginDetail` (command)

Fetch detailed plugin information.

```typescript
const result = await fetchPluginDetail({ pluginId: 'my-plugin' });
```

#### 3. `uninstallPlugin` (command)

Remove a plugin from the system.

```typescript
const result = await uninstallPlugin({ pluginId: 'my-plugin' });
```

**Permission check:** Verifies the user has `plugin.manual.install` permission.

**Operation:**
1. Checks if the plugin exists
2. Deletes plugin files from the filesystem
3. Deletes the plugin entry from the database
4. Returns success or failure result

## Components

### PluginUpload.svelte

Plugin upload via drag & drop or file browser.

**Configuration:**

```typescript
const PLUGIN_EXTENSION = '.raconapkg';
const MAX_SIZE_MB = 10;
```

**Validations:**
1. **File extension** — Only `.raconapkg` files
2. **File size** — Maximum 10 MB

**Upload process:**
1. Select file (drag & drop or browser)
2. Validation (extension, size)
3. Upload to `/api/plugins/validate` endpoint
4. Server-side validation
5. Navigate to `PluginPreview` component

### PluginDetail.svelte

Display detailed plugin information.

**Displayed information:**
1. Basic info (status, App ID, version, category)
2. Details (author, description)
3. Permissions (list of requested permissions with badges)
4. Dependencies (name and version in badge format)
5. System info (min WebOS version, install date, update date)

**Uninstall confirmation:**

```svelte
<ConfirmDialog
  bind:open={uninstallDialogOpen}
  title={t('plugin-manager.detail.uninstallTitle')}
  description={t('plugin-manager.detail.uninstallDescription', { name })}
  confirmText={t('plugin-manager.detail.uninstallConfirm')}
  confirmVariant="destructive"
  onConfirm={confirmUninstall}
  onCancel={cancelUninstall}
/>
```

## Plugin system

### Plugin structure

A plugin is an `.raconapkg` file, which is a ZIP archive with the following structure:

```
my-plugin.raconapkg
├── manifest.json         # Plugin metadata
├── index.html           # Plugin entry point (Web Component)
├── icon.svg             # Plugin icon
├── assets/              # Static files
│   ├── styles.css
│   └── script.js
└── locales/             # Translations (optional)
    ├── hu.json
    └── en.json
```

### Manifest.json

```json
{
  "id": "my-plugin",
  "name": { "hu": "Saját Plugin", "en": "My Plugin" },
  "description": { "hu": "Plugin leírás", "en": "Plugin description" },
  "version": "1.0.0",
  "author": "Developer Name",
  "category": "productivity",
  "icon": "icon.svg",
  "entryPoint": "index.html",
  "permissions": ["storage.read", "storage.write", "notifications.send"],
  "dependencies": { "another-plugin": "^2.0.0" },
  "minWebosVersion": "1.0.0"
}
```

### Plugin validation

The `/api/plugins/validate` endpoint validates the uploaded plugin:

1. **File format** — ZIP archive
2. **Manifest exists** — `manifest.json` file present
3. **Manifest schema** — Required fields check
4. **Duplication** — Plugin ID uniqueness
5. **Dependencies** — Dependency availability
6. **Version compatibility** — Minimum WebOS version check
7. **Permissions** — Valid permissions

## Database schema

### `apps` table (plugin fields)

```typescript
{
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 100 }).notNull().unique(),
  appType: varchar('app_type', { length: 20 }).notNull(), // 'plugin'
  name: jsonb('name').notNull(),
  description: jsonb('description'),
  version: varchar('version', { length: 20 }).notNull(),
  pluginPermissions: jsonb('plugin_permissions'),
  pluginDependencies: jsonb('plugin_dependencies'),
  pluginStatus: varchar('plugin_status', { length: 20 }),
  pluginInstalledAt: timestamp('plugin_installed_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
}
```

## Best practices

1. **Validation** — Always validate the plugin before installation
2. **Permissions** — Only request necessary permissions
3. **Dependencies** — Document plugin dependencies
4. **Versioning** — Use semantic versioning (semver)
5. **Sandbox** — Use sandbox for plugin isolation
6. **Error handling** — Handle plugin loading errors
7. **Performance** — Optimize plugin size
8. **Documentation** — Provide detailed description and usage guide

## Troubleshooting

### Plugin not appearing in the list

**Problem**: Uploaded plugin not visible among installed plugins.

**Solution**:
1. Check the `apps` table — `appType = 'plugin'`
2. Check the `pluginStatus` field — may be 'inactive'
3. Check permissions
4. Refresh the app registry

### Plugin upload fails

**Problem**: Plugin upload returns an error.

**Solution**:
1. Check the file extension (`.raconapkg`)
2. Check the file size (max 10 MB)
3. Check `manifest.json` — is it valid JSON?
4. Check required fields (id, name, version, etc.)
5. Check server logs
