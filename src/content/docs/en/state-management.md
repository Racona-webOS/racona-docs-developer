---
title: State Management
description: Svelte 5 rune-based stores, singleton pattern, Context API integration, and app-specific stores
---

## Overview

Racona uses Svelte 5 runes for state management. Stores are class-based with `$state` properties and follow the singleton pattern.

## Global Stores

Global stores are located in the `src/lib/stores/` folder:

| File                          | Store Class     | Description                         |
| ----------------------------- | --------------- | ----------------------------------- |
| `windowStore.svelte.ts`       | `WindowManager` | Window management, app loading      |
| `themeStore.svelte.ts`        | `ThemeManager`  | Theme, dark/light mode, colors      |
| `desktopStore.svelte.ts`      | `DesktopStore`  | Desktop icons, layout               |
| `notificationStore.svelte.ts` | `NotificationStore` | Notifications                    |
| `permissionStore.svelte.ts`   | `PermissionStore` | Permissions                       |
| `connectionStore.svelte.ts`   | `ConnectionStore` | Server connection status          |

## Store Pattern

Every store follows the same pattern:

```typescript
// src/lib/stores/myStore.svelte.ts
import { getContext, setContext } from 'svelte';

export class MyManager {
  // Reactive state – $state rune
  data = $state<MyData>({ value: '' });
  isLoading = $state(false);

  // Derived value – $derived rune
  isEmpty = $derived(this.data.value === '');

  // Method
  async update(newValue: string) {
    this.isLoading = true;
    // ... async operation
    this.data.value = newValue;
    this.isLoading = false;
  }
}

// Context key
const MY_MANAGER_KEY = Symbol('myManager');

// Global singleton
let globalMyManager: MyManager | null = null;

// Creation (once, at app initialization)
export function createMyManager() {
  if (!globalMyManager) {
    globalMyManager = new MyManager();
  }
  return globalMyManager;
}

// Place in context (in layout component)
export function setMyManager(manager: MyManager) {
  globalMyManager = manager;
  setContext(MY_MANAGER_KEY, manager);
}

// Retrieve (from components)
export function getMyManager(): MyManager {
  try {
    return getContext(MY_MANAGER_KEY);
  } catch {
    if (!globalMyManager) {
      globalMyManager = new MyManager();
    }
    return globalMyManager;
  }
}
```

## Importing

Stores can be imported from the central `$lib/stores` barrel export:

```typescript
import { getWindowManager, getThemeManager } from '$lib/stores';
```

Or directly:

```typescript
import { getWindowManager } from '$lib/stores/windowStore.svelte';
```

## Using in Components

```svelte
<script lang="ts">
  import { getWindowManager } from '$lib/stores';

  const windowManager = getWindowManager();
</script>

<!-- The $state is reactive – automatically updates -->
{#each windowManager.windows as window}
  <div>{window.title}</div>
{/each}

<button onclick={() => windowManager.openWindow('settings', 'Settings')}>
  Open
</button>
```

## WindowManager

The `WindowManager` handles all open windows and application loading.

```typescript
const wm = getWindowManager();

// Open window
wm.openWindow(
  'settings',           // app name (src/apps/ folder name)
  'Settings',           // window title
  {                     // metadata (optional)
    defaultSize: { width: 800, height: 600 },
    maximizable: true,
    resizable: true
  },
  { tab: 'security' }   // parameters for the app (optional)
);

// Close window
wm.closeWindow(windowId);

// Activate window
wm.activateWindow(windowId);

// Minimize/restore
wm.minimizeWindow(windowId);

// Maximize/restore
wm.maximizeWindow(windowId);

// Update title
wm.updateWindowTitle(windowId, 'New Title');

// Get parameters
const params = wm.getWindowParameters(windowId);
```

### WindowState Type

```typescript
type WindowState = {
  id: string;
  appName: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  parameters?: AppParameters;
  isLoading?: boolean;
  screenshot?: string;
};
```

## ThemeManager

```typescript
const theme = getThemeManager();

// Set mode
await theme.setMode('dark');    // 'light' | 'dark' | 'auto'

// Set color (HSL hue value)
await theme.setColor('160');

// Font size
await theme.setFontSize('medium');  // 'small' | 'medium' | 'large'

// Read
console.log(theme.effectiveMode);   // 'light' | 'dark'
console.log(theme.isDark);          // boolean
console.log(theme.cssClasses);      // e.g. 'dark font-medium'
console.log(theme.cssVariables);    // CSS variables object
```

## App-Specific Stores

App-specific stores live in the app's `stores/` folder and follow the same pattern:

```typescript
// src/apps/myapp/stores/myAppStore.svelte.ts
export class MyAppStore {
  items = $state<Item[]>([]);
  selectedId = $state<string | null>(null);

  selected = $derived(
    this.items.find(i => i.id === this.selectedId) ?? null
  );

  setSelected(id: string) {
    this.selectedId = id;
  }
}

let instance: MyAppStore | null = null;

export function getMyAppStore() {
  if (!instance) instance = new MyAppStore();
  return instance;
}
```

Usage in the app component:

```svelte
<script lang="ts">
  import { getMyAppStore } from './stores/myAppStore.svelte';

  const store = getMyAppStore();
</script>

{#if store.selected}
  <p>{store.selected.name}</p>
{/if}
```

## Using $effect

The `$effect` rune is for handling side effects (e.g., loading data when state changes):

```svelte
<script lang="ts">
  import { getMyAppStore } from './stores/myAppStore.svelte';

  const store = getMyAppStore();

  $effect(() => {
    // Runs when store.selectedId changes
    if (store.selectedId) {
      loadDetails(store.selectedId);
    }
  });

  async function loadDetails(id: string) {
    // ...
  }
</script>
```

:::caution
Don't modify state in `$effect` that you're reading — it can cause infinite loops. Use `$derived` instead where possible.
:::

## Triggering Reactivity with Arrays

In Svelte 5, array mutations (e.g., `push`, `splice`) don't always trigger reactivity. Instead:

```typescript
// ❌ Not reactive
this.windows.push(newWindow);

// ✅ Reactive
this.windows = [...this.windows, newWindow];

// ✅ Modify element
this.windows = this.windows.map(w =>
  w.id === id ? { ...w, isActive: true } : w
);
```
