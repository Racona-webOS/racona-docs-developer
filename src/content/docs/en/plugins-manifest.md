---
title: manifest.json Reference
description: Detailed documentation of all fields in the application manifest.json file – required and optional fields, types, and examples
---

The `manifest.json` is the application's "passport" — Racona uses it to know how to load and display the application.

## Full Example

```json
{
  "id": "my-app",
  "name": {
    "hu": "Saját Alkalmazás",
    "en": "My App"
  },
  "description": {
    "hu": "Alkalmazás leírása magyarul",
    "en": "App description in English"
  },
  "version": "1.0.0",
  "author": "Developer Name <email@example.com>",
  "entry": "dist/index.iife.js",
  "icon": "icon.svg",
  "iconStyle": "cover",
  "category": "utilities",
  "permissions": ["database", "notifications", "remote_functions"],
  "multiInstance": false,
  "defaultSize": { "width": 800, "height": 600 },
  "minSize": { "width": 400, "height": 300 },
  "maxSize": { "width": 1920, "height": 1080 },
  "keywords": ["example", "demo"],
  "isPublic": true,
  "sortOrder": 100,
  "dependencies": {
    "svelte": "^5.0.0",
    "@lucide/svelte": "^0.561.0"
  },
  "minWebOSVersion": "2.0.0",
  "locales": ["hu", "en"]
}
```

## Required Fields

### `id`

**Type:** `string`

The unique identifier of the application. May only contain lowercase letters, numbers, and hyphens (kebab-case).

```json
"id": "my-awesome-app"
```

:::caution
The ID **cannot be changed** after installation — it identifies the application in the database and filesystem. Choose carefully.
:::

Valid format: `^[a-z0-9-]+$`, minimum 3, maximum 50 characters. The database schema name is derived from the ID: `app__<id>` with hyphens replaced by underscores (e.g. `my-app` → `app__my_app`).

### `name`

**Type:** `{ hu: string, en: string }` or `string`

The display name of the application in the Start Menu and Application Manager.

```json
"name": { "hu": "Saját Alkalmazás", "en": "My App" }
```

### `description`

**Type:** `{ hu: string, en: string }` or `string`

A short description, displayed in the Application Manager.

### `version`

**Type:** `string` — semantic version (`MAJOR.MINOR.PATCH`)

```json
"version": "1.0.0"
```

### `author`

**Type:** `string` — in `Name <email>` format

```json
"author": "John Smith <john@example.com>"
```

### `entry`

**Type:** `string`

The entry point of the build output. **Do not change** — always `"dist/index.iife.js"`.

### `icon`

**Type:** `string`

The icon filename within the `assets/` folder. SVG format is recommended.

```json
"icon": "icon.svg"
```

### `permissions`

**Type:** `string[]`

The list of permissions required by the application. Only include permissions that are actually needed.

```json
"permissions": ["database", "remote_functions"]
```

Available permissions: see [Security and Permissions](/en/plugins-security/).

## Optional Fields

### `iconStyle`

**Type:** `"icon"` | `"cover"`
**Default:** `"cover"`

The display mode of the icon in the Start Menu and Taskbar. `"cover"`: the image fills the icon area (photo, logo); `"icon"`: smaller, icon-like rendering. Any other value fails validation.

### `category`

**Type:** `string`
**Default:** `"utilities"`

The application category for grouping in the Start Menu. E.g.: `"utilities"`, `"productivity"`, `"communication"`.

### `multiInstance`

**Type:** `boolean`
**Default:** `false`

If `true`, the user can open the application in multiple windows simultaneously.

### `defaultSize`

**Type:** `{ width: number, height: number }`
**Default:** `{ width: 800, height: 600 }`

The default window size in pixels.

### `minSize` / `maxSize`

**Type:** `{ width: number, height: number }`

The minimum and maximum window size. If not specified, there is no limit.

### `keywords`

**Type:** `string[]`

Search keywords for the Application Manager.

### `isPublic`

**Type:** `boolean`
**Default:** `true`

If `false`, the application does not appear in the Start Menu — it can only be opened programmatically.

### `sortOrder`

**Type:** `number`
**Default:** `100`

The sort order in the Start Menu. Smaller number = appears earlier.

### `dependencies`

**Type:** `Record<string, string>`

External dependencies used by the application. Only packages on the [whitelist](/en/plugins-security/#allowed-dependencies) are permitted.

```json
"dependencies": {
  "svelte": "^5.0.0",
  "@lucide/svelte": "^0.561.0"
}
```

### `minWebOSVersion`

**Type:** `string`

The minimum required Racona version. If Racona is older, the application cannot be installed.

### `locales`

**Type:** `string[]`

ISO codes of the languages supported by the application.

```json
"locales": ["hu", "en"]
```

### `sidebarComponent`

**Type:** `string`

Only for `menu.json` (AppLayout mode) applications. The name of a component in `src/components/` that Racona mounts at the bottom of the sidebar — for example an organization switcher. The component's custom element tag must be `<id>-<component name in lowercase>` (e.g. `my-app-organizationswitcher`).

```json
"sidebarComponent": "OrganizationSwitcher"
```

At install time it is stored in the `apps.sidebar_component` column, and the core reads it from there at runtime.

### `layout`

**Type:** `{ sidebarWidth?: number | "auto", maxWidthClass?: string }`
**Default:** `{ "sidebarWidth": 230, "maxWidthClass": "max-w-4xl" }`

AppLayout mode only. The sidebar width in pixels, and the maximum content width as a Tailwind class (e.g. `"w-full"` for full width).

```json
"layout": { "sidebarWidth": 280, "maxWidthClass": "w-full" }
```

`menu.json` may also provide a layout in the `{ "layout": {...}, "items": [...] }` form; values there override the manifest.

### `scheduledJobs`

**Type:** `object[]`

Jobs that run on a schedule (requires the `scheduler` permission). The handlers live in `server/jobs.ts`. Fields, rules and limits: [Scheduled Jobs](/en/plugins-scheduler/).

```json
"scheduledJobs": [
  { "id": "daily-check", "handler": "runDailyCheck", "schedule": "0 7 * * *", "timezone": "Europe/Budapest" }
]
```

## Version Management

The `version` field follows semantic versioning:

| Change | Version bump |
|---|---|
| Bug fix | `1.0.0` → `1.0.1` |
| New feature (backwards compatible) | `1.0.1` → `1.1.0` |
| Breaking change | `1.1.0` → `2.0.0` |
