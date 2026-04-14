---
title: Állapotkezelés
description: Svelte 5 runes alapú store-ok, singleton minta, context API integráció és alkalmazás-specifikus store-ok
---

## Áttekintés

A Rocona Svelte 5 rune-okat használ az állapotkezeléshez. A store-ok osztályalapúak, `$state` tulajdonságokkal, és singleton mintát követnek.

## Globális store-ok

A globális store-ok a `src/lib/stores/` mappában találhatók:

| Fájl                          | Store osztály       | Leírás                              |
| ----------------------------- | ------------------- | ----------------------------------- |
| `windowStore.svelte.ts`       | `WindowManager`     | Ablakkezelés, app betöltés          |
| `themeStore.svelte.ts`        | `ThemeManager`      | Téma, sötét/világos mód, színek     |
| `desktopStore.svelte.ts`      | `DesktopStore`      | Asztali ikonok, elrendezés          |
| `notificationStore.svelte.ts` | `NotificationStore` | Értesítések                         |
| `permissionStore.svelte.ts`   | `PermissionStore`   | Jogosultságok                       |
| `connectionStore.svelte.ts`   | `ConnectionStore`   | Szerver kapcsolat állapota          |

## Store minta

Minden store ugyanazt a mintát követi:

```typescript
// src/lib/stores/myStore.svelte.ts
import { getContext, setContext } from 'svelte';

export class MyManager {
  // Reaktív állapot – $state rune
  data = $state<MyData>({ value: '' });
  isLoading = $state(false);

  // Derived érték – $derived rune
  isEmpty = $derived(this.data.value === '');

  // Metódus
  async update(newValue: string) {
    this.isLoading = true;
    // ... aszinkron művelet
    this.data.value = newValue;
    this.isLoading = false;
  }
}

// Context kulcs
const MY_MANAGER_KEY = Symbol('myManager');

// Globális singleton
let globalMyManager: MyManager | null = null;

// Létrehozás (egyszer, az app inicializálásakor)
export function createMyManager() {
  if (!globalMyManager) {
    globalMyManager = new MyManager();
  }
  return globalMyManager;
}

// Context-be helyezés (layout komponensben)
export function setMyManager(manager: MyManager) {
  globalMyManager = manager;
  setContext(MY_MANAGER_KEY, manager);
}

// Lekérés (komponensekből)
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

## Importálás

A store-ok a központi `$lib/stores` barrel exportból importálhatók:

```typescript
import { getWindowManager, getThemeManager } from '$lib/stores';
```

Vagy közvetlenül:

```typescript
import { getWindowManager } from '$lib/stores/windowStore.svelte';
```

## Használat komponensekben

```svelte
<script lang="ts">
  import { getWindowManager } from '$lib/stores';

  const windowManager = getWindowManager();
</script>

<!-- A $state reaktív – automatikusan frissül -->
{#each windowManager.windows as window}
  <div>{window.title}</div>
{/each}

<button onclick={() => windowManager.openWindow('settings', 'Beállítások')}>
  Megnyitás
</button>
```

## WindowManager

A `WindowManager` kezeli az összes nyitott ablakot és az alkalmazások betöltését.

```typescript
const wm = getWindowManager();

// Ablak megnyitása
wm.openWindow(
  'settings',           // app neve (src/apps/ mappa neve)
  'Beállítások',        // ablak címe
  {                     // metadata (opcionális)
    defaultSize: { width: 800, height: 600 },
    maximizable: true,
    resizable: true
  },
  { tab: 'security' }   // paraméterek az appnak (opcionális)
);

// Ablak bezárása
wm.closeWindow(windowId);

// Ablak aktiválása
wm.activateWindow(windowId);

// Minimalizálás/visszaállítás
wm.minimizeWindow(windowId);

// Maximalizálás/visszaállítás
wm.maximizeWindow(windowId);

// Cím frissítése
wm.updateWindowTitle(windowId, 'Új cím');

// Paraméterek lekérése
const params = wm.getWindowParameters(windowId);
```

### WindowState típus

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

// Mód beállítása
await theme.setMode('dark');    // 'light' | 'dark' | 'auto'

// Szín beállítása (HSL hue érték)
await theme.setColor('160');

// Betűméret
await theme.setFontSize('medium');  // 'small' | 'medium' | 'large'

// Olvasás
console.log(theme.effectiveMode);   // 'light' | 'dark'
console.log(theme.isDark);          // boolean
console.log(theme.cssClasses);      // pl. 'dark font-medium'
console.log(theme.cssVariables);    // CSS változók objektum
```

## Alkalmazás-specifikus store-ok

Az alkalmazás-specifikus store-ok az adott app `stores/` mappájában élnek, és ugyanazt a mintát követik:

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

Használat az app komponensében:

```svelte
<script lang="ts">
  import { getMyAppStore } from './stores/myAppStore.svelte';

  const store = getMyAppStore();
</script>

{#if store.selected}
  <p>{store.selected.name}</p>
{/if}
```

## $effect használata

A `$effect` rune mellékhatások kezelésére való (pl. adatok betöltése állapotváltozáskor):

```svelte
<script lang="ts">
  import { getMyAppStore } from './stores/myAppStore.svelte';

  const store = getMyAppStore();

  $effect(() => {
    // Lefut, ha store.selectedId változik
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
Az `$effect`-ben ne módosítsd azokat az állapotokat, amelyeket olvasol — végtelen ciklust okozhat. Használj `$derived`-ot helyette, ahol lehetséges.
:::

## Reaktivitás triggerelése tömbökkel

Svelte 5-ben a tömb mutáció (pl. `push`, `splice`) nem mindig triggereli a reaktivitást. Helyette:

```typescript
// ❌ Nem reaktív
this.windows.push(newWindow);

// ✅ Reaktív
this.windows = [...this.windows, newWindow];

// ✅ Elem módosítása
this.windows = this.windows.map(w =>
  w.id === id ? { ...w, isActive: true } : w
);
```
