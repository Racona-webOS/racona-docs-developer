---
title: Built-in Applications
description: Overview of Racona built-in applications and the application framework
---

Racona ships with 6 built-in applications that provide the system's core functionality. Every application uses a unified framework that ensures a consistent user experience and easy extensibility.

## Application Framework

Racona applications use a unified framework that provides a consistent user experience, easy extensibility, and efficient state management. The central elements of the framework are **AppShell** (state management logic) and **AppLayout** (visual structure), which work together to handle menu navigation, dynamic component loading, and the application lifecycle.

### Architecture Overview

Every built-in application follows the same architecture:

```
┌───────────────────────────────────────────────────────┐
│                      AppLayout                        │
│  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │              │  │                              │   │
│  │  AppSideBar  │  │     AppContentArea           │   │
│  │              │  │  (dynamic component)         │   │
│  │  ┌────────┐  │  │                              │   │
│  │  │ Menu   │  │  │  - Vite glob import          │   │
│  │  │ Items  │  │  │  - Lazy loading              │   │
│  │  └────────┘  │  │  - Props passing             │   │
│  │              │  │                              │   │
│  └──────────────┘  └──────────────────────────────┘   │
│                    ┌──────────────────────────────┐   │
│                    │      ActionBar               │   │
│                    │  (optional action bar)       │   │
│                    └──────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

**Data flow:**

1. **AppShell** manages state (active menu item, component, props)
2. **AppSideBarMenu** renders the menu and handles clicks
3. **AppShell.handleMenuItemClick()** updates state
4. **AppContentArea** detects the change and loads the new component
5. **Component** renders with props and can set the **ActionBar**

### Key Components

#### 1. AppShell

**AppShell** is the central state manager and logic layer for every application. It is responsible for:

- Menu state management (active menu item, expanded parents)
- Component loading coordination
- Navigation handling
- Localization (multilingual menu)
- Parameter handling (URL hash-based navigation)

**Usage:**

```svelte
<script lang="ts">
  import { createAppShell } from '$lib/apps/appShell.svelte';
  import menuData from './menu.json';

  const shell = createAppShell({
    appName: 'settings',
    menuData: menuData as RawMenuItem[]
  });
</script>
```

**Key features:**

- `menuItems` - Localized menu items (reactive)
- `activeMenuItem` - Active menu item href
- `activeComponent` - Loaded component name
- `componentProps` - Props passed to the component
- `expandedParents` - Expanded parent menu items
- `handleMenuItemClick(item)` - Menu item click handler
- `navigateTo(component, props, menuHref)` - Programmatic navigation

#### 2. AppLayout

**AppLayout** is the visual framework that connects all UI elements:

```svelte
<AppLayout
  {shell}
  namespaces={['settings', 'common']}
  maxWidthClass="max-w-3xl"
  sidebarWidth={230}
  searchable={false}
/>
```

**Parameters:**

- `shell` - AppShell instance (required)
- `namespaces` - i18n namespaces (automatically adds 'common')
- `maxWidthClass` - Content max width (Tailwind class)
- `sidebarWidth` - Sidebar width in pixels or 'auto'
- `searchable` - Enable search in the menu
- `isPlugin` - Plugin mode (components loaded via API)

**Features:**

- I18nProvider setup
- Sidebar and menu rendering
- Content area management
- ActionBar display (if content is present)
- Automatic ActionBar clearing on component switch

#### 3. AppSideBar and AppSideBarMenu

The **left sidebar** contains the navigation menu and provides collapsible/expandable functionality.

**AppSideBar features:**

- Collapsible sidebar (ChevronLeft/Right button)
- State saved to localStorage (`app-sidebar-collapsed-${appName}`)
- Configurable width (pixels or 'auto')
- Smooth animations (CSS transitions)
- Gradient background (light/dark mode support)

**AppSideBarMenu features:**

- **Hierarchical menu structure**: Parent-child relationship support
- **Collapsible parents**: Chevron icon with animation
- **Active menu item highlight**: Visual feedback
- **Search**: Optional search field for filtering menu items
- **Smooth animations**: CSS Grid-based (`grid-template-rows: 0fr → 1fr`)
- **Icon support**: UniversalIcon component (Lucide/Phosphor)
- **Separator support**: Divider lines in the menu
- **Hidden item filtering**: Via `hidden: true` field

**Menu state management:**

```typescript
// Expanded items
let expandedItems = $state<Set<string>>(new Set());

// Items manually closed by the user
// (these are not automatically reopened)
let manuallyClosed = $state<Set<string>>(new Set());
```

**Automatic expansion:**

- On search: All parent items containing results are expanded
- Active menu item: Parent items are automatically expanded
- On initialization: Based on the `initialExpandedParents` prop

**Search behavior:**

1. User types a search term
2. `filterItemsBySearch()` recursively filters menu items
3. `getExpandedParentsForSearch()` determines which parents to expand
4. `expandedItems` is updated, menu animates open
5. `manuallyClosed` is cleared (everything visible during search)

**Menu item click:**

```typescript
function handleClick(item: MenuItem, event: MouseEvent) {
  event.preventDefault();
  onItemClick?.(item);  // AppShell.handleMenuItemClick()
}
```

#### 4. AppContentArea

The **content area** dynamically loads and renders components. This is one of the most important parts of the framework, providing lazy loading and efficient component management.

**How it works:**

1. **Vite glob import** for all app components:
   ```typescript
   const appComponentModules = import.meta.glob('/src/apps/*/components/*.svelte');
   // Result: { '/src/apps/settings/components/ProfileSettings.svelte': () => Promise<Module> }
   ```

2. **On-demand component loading** (lazy loading):
   ```typescript
   const moduleKey = `/src/apps/${appName}/components/${componentName}.svelte`;
   const moduleLoader = appComponentModules[moduleKey];

   if (!moduleLoader) {
     throw new Error(`Component not found: ${componentName}`);
   }

   const module = await moduleLoader();
   loadedComponent = module.default;
   ```

3. **Component rendering** with props:
   ```svelte
   {#if loadedComponent}
     {@const Component = loadedComponent}
     <Component {...props} />
   {/if}
   ```

**Reactive loading:**

```typescript
$effect(() => {
  const currentComponent = component;

  // Guard: don't reload if already loading or already loaded
  if (isLoadingComponent) return;

  if (currentComponent && currentComponent !== lastLoadedComponent) {
    untrack(() => loadComponent(currentComponent));
  } else if (!currentComponent) {
    untrack(() => {
      loadedComponent = null;
      error = null;
      lastLoadedComponent = null;
    });
  }
});
```

**States:**

- `loading` - Loading in progress (show spinner)
- `error` - An error occurred (show error message)
- `loadedComponent` - Loaded component (render)
- `placeholder` - No menu item selected (empty state)
- `isLoadingComponent` - Guard flag (prevent double loading)
- `lastLoadedComponent` - Last loaded component name (cache)

**Plugin support:**

Plugin components are loaded via API and rendered as Web Components:

```typescript
async function loadPluginComponent(componentName: string) {
  // 1. Fetch component code via API
  const response = await fetch(`/api/plugins/${appName}/components/${componentName}`);
  const code = await response.text();

  // 2. Execute code (create factory function)
  const script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);

  // 3. Call factory and get custom element tag name
  const factoryName = `${appName.replace(/-/g, '_')}_Component_${componentName}`;
  const componentFactory = window[factoryName];
  const componentInfo = componentFactory();

  // 4. Render custom element
  loadedComponent = {
    __pluginTagName: componentInfo.tagName,
    __pluginProps: props
  };
}
```

**Error handling:**

- Component not found → Show error message
- Loading error → Console log + error message
- Plugin loading error → Factory function missing

**Performance optimization:**

- Lazy loading: Only the active component is loaded
- Cache: Avoid reloading based on `lastLoadedComponent`
- Guard flag: `isLoadingComponent` prevents double loading
- `untrack()`: Avoids infinite loops

#### 5. ActionBar

The **ActionBar** is an optional action bar at the bottom of the application where components can place buttons and other controls.

**Usage in a component:**

```svelte
<script lang="ts">
  import { getActionBar } from '$lib/apps/actionBar.svelte';
  import { Button } from '$lib/components/ui/button';

  const actionBar = getActionBar();

  // Set ActionBar content
  actionBar.set(myActions);
</script>

{#snippet myActions()}
  <Button onclick={handleSave}>Save</Button>
  <Button variant="outline" onclick={handleCancel}>Cancel</Button>
{/snippet}
```

**API:**

- `content` - Current snippet (null if none)
- `set(snippet)` - Set snippet
- `clear()` - Clear content

**Automatic clearing:**

AppLayout automatically clears the ActionBar content on component switch, so no manual management is needed.

### Menu Structure (menu.json)

Every application has a `menu.json` file that defines the menu items. The menu supports hierarchical structure, localization, and permission-based filtering.

**Example menu structure:**

```json
[
  {
    "labelKey": "menu.profile",
    "href": "#profile",
    "icon": "User",
    "component": "ProfileSettings"
  },
  {
    "labelKey": "menu.desktop",
    "href": "#",
    "icon": "Monitor",
    "children": [
      {
        "labelKey": "menu.general",
        "href": "#desktop",
        "icon": "Settings",
        "component": "DesktopSettings"
      },
      {
        "labelKey": "menu.background",
        "href": "#background",
        "icon": "Image",
        "component": "BackgroundSettings"
      }
    ]
  },
  {
    "separator": true
  },
  {
    "labelKey": "menu.advanced",
    "href": "#advanced",
    "icon": "Settings",
    "component": "AdvancedSettings",
    "requiredPermission": "settings.advanced.view",
    "hideWhen": "notDevMode"
  }
]
```

**Menu item fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `labelKey` | string | Yes | Translation key (e.g. "menu.profile" → "settings.menu.profile") |
| `href` | string | Yes | URL hash (e.g. "#profile"). Can be "#" for parent items |
| `icon` | string | No | Icon name (Lucide or Phosphor, e.g. "User", "Settings") |
| `component` | string | No* | Component name from the `components/` folder (e.g. "ProfileSettings") |
| `children` | array | No | Sub-menu items array (hierarchical menu) |
| `separator` | boolean | No | Divider line (no other fields needed when true) |
| `requiredPermission` | string | No | Required permission (e.g. "settings.advanced.view") |
| `hideWhen` | string | No | Conditional hiding (e.g. "notDevMode", "singleLocale") |
| `props` | object | No | Props passed to the component (e.g. `{ "mode": "advanced" }`) |
| `hidden` | boolean | No | Hide menu item (not shown when true) |

\* The `component` field is required if the menu item has no `children` and is not a `separator`.

**Menu localization:**

The menu is automatically localized using the `localizeMenuItems()` function:

```typescript
// Namespace: appName (e.g. 'settings')
// Key: labelKey (e.g. 'menu.profile')
// Full key: 'settings.menu.profile'

const menuItems = $derived.by(() => {
  void translationStore.currentLocale;
  return localizeMenuItems(appName, rawMenuData);
});
```

**Adding translations:**

```sql
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('settings', 'menu.profile', 'hu', 'Profil'),
  ('settings', 'menu.profile', 'en', 'Profile'),
  ('settings', 'menu.desktop', 'hu', 'Asztal'),
  ('settings', 'menu.desktop', 'en', 'Desktop');
```

**Hierarchical menu:**

Use the `children` field to create multi-level menus:

```json
{
  "labelKey": "menu.desktop",
  "href": "#",
  "icon": "Monitor",
  "children": [
    {
      "labelKey": "menu.general",
      "href": "#desktop",
      "component": "DesktopSettings"
    }
  ]
}
```

**Important rules:**

1. **Parent menu item href**: If it has `children`, the `href` can be "#" (no navigation)
2. **Parent menu item component**: Optional; if present, clicking the parent also loads it
3. **Child menu items**: Always require a `component` field
4. **Separator**: Only `separator: true` is needed, nothing else
5. **Icon**: Optional, but recommended for better UX

**Permission-based filtering:**

Use the `requiredPermission` field to restrict menu item visibility:

```json
{
  "labelKey": "menu.advanced",
  "href": "#advanced",
  "component": "AdvancedSettings",
  "requiredPermission": "settings.advanced.view"
}
```

If the user does not have the required permission, the menu item is automatically hidden.

**Conditional hiding:**

Use the `hideWhen` field to conditionally hide menu items:

```json
{
  "labelKey": "menu.language",
  "href": "#language",
  "component": "LanguageSettings",
  "hideWhen": "singleLocale"
}
```

Supported values:
- `"singleLocale"` - Hides when only one language is in the system
- `"notDevMode"` - Hides when the system is not running in developer mode

### Component Lifecycle

1. **Application startup**
   - AppShell creation
   - Menu loading and localization
   - Default menu item selection (first one with a component)

2. **Menu item click**
   - `handleMenuItemClick(item)` called
   - `activeComponent` updated
   - `componentProps` set
   - URL hash updated (section parameter)

3. **Component loading**
   - AppContentArea `$effect` triggered
   - Vite glob import used
   - Async component loading
   - Component rendering with props

4. **ActionBar management**
   - Component sets the ActionBar (`actionBar.set()`)
   - ActionBar appears at the bottom of the application
   - Automatic clearing on component switch

5. **Navigation**
   - URL hash change (`#profile` → `#security`)
   - AppShell `$effect` detects the change
   - Appropriate menu item activated
   - Component loading

### Multilingual Support

The menu is automatically localized using the `localizeMenuItems` function:

```typescript
// Namespace: appName (e.g. 'settings')
// Key: labelKey (e.g. 'menu.profile')
// Full key: 'settings.menu.profile'

const menuItems = $derived.by(() => {
  void translationStore.currentLocale;
  return localizeMenuItems(appName, rawMenuData);
});
```

**Translations:**

```sql
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('settings', 'menu.profile', 'hu', 'Profil'),
  ('settings', 'menu.profile', 'en', 'Profile');
```

### Permission Checking

Menu items are automatically filtered based on the user's permissions:

```typescript
// menu.json
{
  "labelKey": "menu.advanced",
  "requiredPermission": "settings.advanced.view",
  // ...
}
```

If the user does not have the required permission, the menu item is not shown.

### URL Parameters

Applications support the `section` parameter in the URL hash:

```typescript
// Open window with section parameter
windowManager.openWindow('settings', 'Settings', settingsApp, {
  section: 'profile'  // → activate #profile menu item
});
```

AppShell automatically detects the section parameter and activates the appropriate menu item.

## Built-in Applications List

### 1. Settings

System and user settings management.

**Key features:**
- Profile settings
- Appearance (theme, language)
- Security (password, 2FA)
- Theme previews

**Menu structure:** 3 main categories, 11 components

[Detailed documentation →](/en/builtin-apps/settings)

### 2. Users

User, group, role, and permission management.

**Key features:**
- User CRUD
- Group management
- Role management
- Permission management
- Resource management

**Access:** Admin users only

[Detailed documentation →](/en/builtin-apps/users)

### 3. Chat

Real-time messaging system with Socket.IO.

**Key features:**
- Real-time messaging
- Online/offline status
- Typing indicator
- Unread messages
- Toast notifications

**Technology:** Socket.IO + REST API fallback

[Detailed documentation →](/en/builtin-apps/chat)

### 4. Log

System and error log viewer.

**Key features:**
- Error logs in tabular view
- Filter by log level
- Filter by source
- Sorting and pagination

**Access:** `log.error.view` (admin)

[Detailed documentation →](/en/builtin-apps/log)

### 5. Plugin Manager

Plugin installation, management, and removal.

**Key features:**
- Plugin upload (.elyospkg)
- Plugin validation
- Installed plugins list
- Plugin details
- Plugin removal

**Access:** `plugin.manual.install` (admin)

[Detailed documentation →](/en/builtin-apps/plugin-manager)

### 6. Help

Context-sensitive help system.

**Status:** Under development

**Planned features:**
- Context-sensitive help
- Help button in windows
- Search in help content
- Multilingual content

[Detailed documentation →](/en/builtin-apps/help)

## Creating a New Application

### 1. Basic Structure

```
apps/my-app/
├── index.svelte              # Main entry point
├── icon.svg                  # Application icon
├── menu.json                 # Menu definition
├── my-app.remote.ts          # Server actions
├── components/               # UI components
│   ├── Component1.svelte
│   └── Component2.svelte
└── stores/                   # State management (optional)
    └── myAppStore.svelte.ts
```

### 2. Creating index.svelte

```svelte
<script lang="ts">
  import type { RawMenuItem } from '$lib/types/menu';
  import { AppLayout } from '$lib/components/shared';
  import { createAppShell } from '$lib/apps/appShell.svelte';
  import menuData from './menu.json';

  const shell = createAppShell({
    appName: 'my-app',
    menuData: menuData as RawMenuItem[]
  });
</script>

<AppLayout {shell} namespaces={['my-app']} />
```

### 3. Creating menu.json

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

### 4. Creating Components

```svelte
<!-- components/Overview.svelte -->
<script lang="ts">
  import { getActionBar } from '$lib/apps/actionBar.svelte';
  import { Button } from '$lib/components/ui/button';

  const actionBar = getActionBar();
  actionBar.set(actions);

  function handleAction() {
    console.log('Action clicked');
  }
</script>

{#snippet actions()}
  <Button onclick={handleAction}>Action</Button>
{/snippet}

<div class="title-block">
  <h2>Overview</h2>
  <h3>Application overview page</h3>
</div>

<p>Content...</p>
```

### 5. Adding Translations

```sql
-- packages/database/src/seeds/translations/my-app.ts
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('my-app', 'title', 'hu', 'Saját Alkalmazás'),
  ('my-app', 'title', 'en', 'My App'),
  ('my-app', 'menu.overview', 'hu', 'Áttekintés'),
  ('my-app', 'menu.overview', 'en', 'Overview');
```

### 6. Registering the Application

```sql
-- packages/database/src/seeds/platform/apps.ts
{
  appId: 'my-app',
  appType: 'builtin',
  name: { hu: 'Saját Alkalmazás', en: 'My App' },
  description: { hu: 'Leírás', en: 'Description' },
  version: '1.0.0',
  icon: 'icon.svg',
  category: 'productivity',
  isActive: true
}
```

## Best Practices

1. **Consistent menu structure**: Use meaningful hrefs (#profile, #security)
2. **Component names**: PascalCase (ProfileSettings.svelte)
3. **ActionBar usage**: Only when necessary (save, cancel buttons)
4. **Translations**: Always provide both Hungarian and English versions
5. **Permissions**: Use `requiredPermission` for sensitive menu items
6. **Icon selection**: Use consistent icons (Lucide or Phosphor)
7. **Props passing**: Use the `props` field in menu.json
8. **Error handling**: Handle component loading errors
9. **Loading state**: Display the loading state
10. **Responsive design**: Design for mobile views as well

## Troubleshooting

### Component Not Loading

**Problem**: "Component not found" error.

**Solution**:
1. Check the component name in menu.json
2. Verify the component exists in the `components/` folder
3. Check the browser console for detailed errors

### Menu Not Showing

**Problem**: The sidebar is empty.

**Solution**:
1. Check the menu.json syntax
2. Check translations (namespace + labelKey)
3. Verify permissions

### ActionBar Not Showing

**Problem**: The ActionBar is not visible.

**Solution**:
1. Check that you called `actionBar.set()`
2. Verify the snippet is correctly defined
3. Check that AppLayout renders the ActionBar
