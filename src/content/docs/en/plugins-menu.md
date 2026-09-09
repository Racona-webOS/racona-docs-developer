---
title: menu.json and AppLayout Mode
description: Building multi-page applications with menu.json, AppLayout mode, and component builds
---

## What is AppLayout Mode?

If a `menu.json` file is present in the application root, Racona loads the application in AppLayout mode. In this mode, the application appears as a multi-page application with a sidebar navigation — the same layout as built-in applications (e.g. Settings, Users).

Without AppLayout mode (standalone), the application loads as a single Web Component filling the entire window.

---

## menu.json Structure

```json
[
  {
    "labelKey": "menu.overview",
    "href": "#overview",
    "icon": "Home",
    "component": "Overview"
  },
  {
    "labelKey": "menu.settings",
    "href": "#settings",
    "icon": "Settings",
    "component": "Settings"
  }
]
```

### Fields

| Field | Type | Description |
|---|---|---|
| `labelKey` | `string` | i18n key for the menu item label (from the application's `locales/` files) |
| `href` | `string` | Hash-based route (e.g. `#overview`) |
| `icon` | `string` | Lucide icon name (PascalCase, e.g. `Home`, `Settings`, `Table`) |
| `component` | `string` | Name of the Svelte component to load (filename without extension) |
| `children` | `MenuItem[]` | Optional submenu. The parent then needs no `component`, and `href` may be `"#"`. |
| `requiredPermission` | `string` | Core permission (e.g. `plugin.manual.install`) required to show the item. |
| `requiredCapability` | `string` | Plugin-specific capability (e.g. `project.create`) required to show the item — see below. |

### Submenus and Conditional Items

```json
[
  {
    "labelKey": "menu.projects",
    "href": "#",
    "icon": "FolderKanban",
    "children": [
      { "labelKey": "menu.projects.list", "href": "#projects", "icon": "List", "component": "ProjectList" },
      { "labelKey": "menu.projects.create", "href": "#projects/new", "icon": "Plus", "component": "ProjectCreate", "requiredCapability": "project.create" }
    ]
  }
]
```

`requiredCapability` builds on the plugin's own permission model: the plugin computes the current user's capabilities on the client (e.g. via a server function reading its own `roles` tables) and publishes them to the core:

```typescript
window.dispatchEvent(
  new CustomEvent('plugin-capabilities-changed', {
    detail: { pluginId: 'my-app', capabilities: ['project.create', 'employee.view'] }
  })
);
```

The core then hides menu items whose `requiredCapability` is not in the set. If all children of a parent are hidden, the parent disappears too. Re-dispatch the event whenever the set changes (e.g. on organization switch).

### Layout in menu.json

`menu.json` can be a plain array, or `{ "layout": { "sidebarWidth": 280, "maxWidthClass": "w-full" }, "items": [...] }`. See the [manifest reference](/en/plugins-manifest/#layout) for the `layout` field.

### Icon Names

The `icon` field value can be any [Lucide](https://lucide.dev/icons/) icon name in PascalCase format:

```json
"icon": "Home"        // home icon
"icon": "Settings"    // gear icon
"icon": "Table"       // table icon
"icon": "Puzzle"      // puzzle piece
"icon": "Users"       // users icon
"icon": "BarChart"    // bar chart
```

---

## Component Placement

In AppLayout mode, each menu item has a dedicated Svelte component. These should be placed in the `src/components/` folder:

```
my-app/
├── manifest.json
├── menu.json
├── src/
│   ├── App.svelte          # Main entry point (optional in AppLayout mode)
│   └── components/
│       ├── Overview.svelte
│       ├── Settings.svelte
│       └── DataTableDemo.svelte
├── locales/
│   ├── hu.json
│   └── en.json
└── build-all.js
```

The `component` field value in `menu.json` must match the filename (without extension):

```json
{ "component": "Overview" }   →   src/components/Overview.svelte
{ "component": "Settings" }   →   src/components/Settings.svelte
```

---

## Building in AppLayout Mode

Since each component must be built separately, the `build-all.js` script automates this:

```bash
bun run build:all
```

The script:
1. Builds the main application (`BUILD_MODE=main`)
2. Iterates through the `src/components/` folder
3. Builds each `.svelte` file as a separate entry point

```js
// build-all.js
// 1. Main application build
execSync('BUILD_MODE=main vite build', { stdio: 'inherit' });

// 2. Build components
for (const file of svelteFiles) {
  execSync(`BUILD_MODE=components COMPONENT_FILE=${file} vite build`, {
    stdio: 'inherit'
  });
}
```

The build output:

```
dist/
├── index.js              # Main entry point
├── Overview.js           # Overview component
├── Settings.js           # Settings component
├── DataTableDemo.js      # DataTableDemo component
└── assets/
```

---

## Translations for Menu Items

The `labelKey` values are loaded from the application's `locales/` files. For example:

```json
// locales/hu.json
{
  "menu.overview": "Áttekintés",
  "menu.settings": "Beállítások",
  "menu.datatable": "Adattábla"
}

// locales/en.json
{
  "menu.overview": "Overview",
  "menu.settings": "Settings",
  "menu.datatable": "Data Table"
}
```

---

## Full Example

The `sdk-demo` application is a good reference for AppLayout mode. It has four menu items:

```json
[
  {
    "labelKey": "menu.overview",
    "href": "#overview",
    "icon": "Home",
    "component": "Overview"
  },
  {
    "labelKey": "menu.demo",
    "href": "#demo",
    "icon": "Puzzle",
    "component": "HelloWorldDemo"
  },
  {
    "labelKey": "menu.datatable",
    "href": "#datatable",
    "icon": "Table",
    "component": "DataTableDemo"
  },
  {
    "labelKey": "menu.settings",
    "href": "#settings",
    "icon": "Settings",
    "component": "Settings"
  }
]
```

Source: `racona-core/examples/apps/sdk-demo/`

---

## When to Use AppLayout Mode?

| Standalone (no menu.json) | AppLayout (with menu.json) |
|---|---|
| Simple, single-page widget | Application with multiple views |
| Dashboard element | Settings, admin interface |
| Small utility tool | Complex data management app |

If your application contains multiple logically separate sections, AppLayout mode provides a better user experience and consistent appearance with other built-in applications.
