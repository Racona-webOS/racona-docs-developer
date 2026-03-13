---
title: Beépített alkalmazások
description: ElyOS beépített alkalmazásainak áttekintése és alkalmazás keretrendszer
---

Az ElyOS rendszer 6 beépített alkalmazással érkezik, amelyek a rendszer alapvető funkcióit biztosítják. Minden alkalmazás egy egységes keretrendszert használ, amely biztosítja a konzisztens felhasználói élményt és a könnyű bővíthetőséget.

## Alkalmazás keretrendszer

Az ElyOS alkalmazások egy egységes keretrendszert használnak, amely biztosítja a konzisztens felhasználói élményt, a könnyű bővíthetőséget és a hatékony állapotkezelést. A keretrendszer központi eleme az **AppShell** (állapotkezelő logika) és az **AppLayout** (vizuális struktúra), amelyek együttműködve kezelik a menünavigációt, a dinamikus komponens betöltést és az alkalmazás életciklusát.

### Architektúra áttekintés

Minden beépített alkalmazás ugyanazt az architektúrát követi:

```
┌─────────────────────────────────────────────────────────┐
│                      AppLayout                          │
│  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │              │  │                              │   │
│  │  AppSideBar  │  │     AppContentArea          │   │
│  │              │  │  (dinamikus komponens)      │   │
│  │  ┌────────┐  │  │                              │   │
│  │  │ Menu   │  │  │  - Vite glob import         │   │
│  │  │ Items  │  │  │  - Lazy loading             │   │
│  │  └────────┘  │  │  - Props átadás             │   │
│  │              │  │                              │   │
│  └──────────────┘  └──────────────────────────────┘   │
│                    ┌──────────────────────────────┐   │
│                    │      ActionBar               │   │
│                    │  (opcionális funkciósáv)     │   │
│                    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Adatfolyam:**

1. **AppShell** kezeli az állapotot (aktív menüpont, komponens, props)
2. **AppSideBarMenu** megjeleníti a menüt és kezeli a kattintásokat
3. **AppShell.handleMenuItemClick()** frissíti az állapotot
4. **AppContentArea** detektálja a változást és betölti az új komponenst
5. **Komponens** renderelődik a props-okkal és beállíthatja az **ActionBar**-t

### Főbb komponensek

#### 1. AppShell

Az **AppShell** a központi állapotkezelő és logikai réteg minden alkalmazáshoz. Felelős:

- Menü állapot kezelése (aktív menüpont, kinyitott szülők)
- Komponens betöltés koordinálása
- Navigáció kezelése
- Lokalizáció (többnyelvű menü)
- Paraméter kezelés (URL hash alapú navigáció)

**Használat:**

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

**Főbb funkciók:**

- `menuItems` - Lokalizált menüpontok (reaktív)
- `activeMenuItem` - Aktív menüpont href-je
- `activeComponent` - Betöltött komponens neve
- `componentProps` - Komponensnek átadott props
- `expandedParents` - Kinyitott szülő menüpontok
- `handleMenuItemClick(item)` - Menüpont kattintás kezelő
- `navigateTo(component, props, menuHref)` - Programozott navigáció

#### 2. AppLayout

Az **AppLayout** a vizuális keretrendszer, amely összeköti az összes UI elemet:

```svelte
<AppLayout
  {shell}
  namespaces={['settings', 'common']}
  maxWidthClass="max-w-3xl"
  sidebarWidth={230}
  searchable={false}
/>
```

**Paraméterek:**

- `shell` - AppShell példány (kötelező)
- `namespaces` - i18n namespace-ek (automatikusan hozzáadja a 'common'-t)
- `maxWidthClass` - Tartalom max szélessége (Tailwind osztály)
- `sidebarWidth` - Sidebar szélessége pixelben vagy 'auto'
- `searchable` - Keresés engedélyezése a menüben
- `isPlugin` - Plugin mód (komponensek API-n keresztül töltődnek)

**Funkciók:**

- I18nProvider beállítása
- Sidebar és menü renderelése
- Tartalom terület kezelése
- ActionBar megjelenítése (ha van tartalom)
- Automatikus ActionBar törlés komponens váltáskor

#### 3. AppSideBar és AppSideBarMenu

A **bal oldali sidebar** tartalmazza a navigációs menüt és biztosítja az összecsukható/kinyitható funkcionalitást.

**AppSideBar funkciók:**

- Összecsukható sidebar (ChevronLeft/Right gomb)
- Állapot mentése localStorage-ba (`app-sidebar-collapsed-${appName}`)
- Konfigurálható szélesség (pixelben vagy 'auto')
- Smooth animációk (CSS transitions)
- Gradient háttér (light/dark mode támogatás)

**AppSideBarMenu funkciók:**

- **Hierarchikus menü struktúra**: Szülő-gyerek kapcsolatok támogatása
- **Összecsukható szülők**: Chevron ikon animációval
- **Aktív menüpont kiemelés**: Vizuális feedback
- **Keresés**: Opcionális keresőmező a menüpontok szűréséhez
- **Smooth animációk**: CSS Grid alapú (`grid-template-rows: 0fr → 1fr`)
- **Ikon támogatás**: UniversalIcon komponens (Lucide/Phosphor)
- **Separator támogatás**: Elválasztó vonalak a menüben
- **Rejtett menüpontok szűrése**: `hidden: true` mezővel

**Menü állapot kezelés:**

```typescript
// Kinyitott menüpontok
let expandedItems = $state<Set<string>>(new Set());

// Felhasználó által manuálisan bezárt menüpontok
// (ezeket nem nyitjuk ki automatikusan)
let manuallyClosed = $state<Set<string>>(new Set());
```

**Automatikus kinyitás:**

- Kereséskor: Minden szülő menüpont kinyílik, amely tartalmaz találatot
- Aktív menüpont: A szülő menüpontok automatikusan kinyílnak
- Inicializáláskor: Az `initialExpandedParents` prop alapján

**Keresés működése:**

1. Felhasználó beír egy keresőszót
2. `filterItemsBySearch()` rekurzívan szűri a menüpontokat
3. `getExpandedParentsForSearch()` meghatározza a kinyitandó szülőket
4. `expandedItems` frissül, a menü animáltan kinyílik
5. `manuallyClosed` törlődik (keresés közben minden látható)

**Menüpont kattintás:**

```typescript
function handleClick(item: MenuItem, event: MouseEvent) {
  event.preventDefault();
  onItemClick?.(item);  // AppShell.handleMenuItemClick()
}
```

#### 4. AppContentArea

A **tartalmi terület** dinamikusan tölti be és rendereli a komponenseket. Ez a keretrendszer egyik legfontosabb része, amely biztosítja a lazy loading-ot és a hatékony komponens kezelést.

**Működési elv:**

1. **Vite glob import** az összes app komponenshez:
   ```typescript
   const appComponentModules = import.meta.glob('/src/apps/*/components/*.svelte');
   // Eredmény: { '/src/apps/settings/components/ProfileSettings.svelte': () => Promise<Module> }
   ```

2. **Komponens betöltés igény szerint** (lazy loading):
   ```typescript
   const moduleKey = `/src/apps/${appName}/components/${componentName}.svelte`;
   const moduleLoader = appComponentModules[moduleKey];

   if (!moduleLoader) {
     throw new Error(`Komponens nem található: ${componentName}`);
   }

   const module = await moduleLoader();
   loadedComponent = module.default;
   ```

3. **Komponens renderelés** props-okkal:
   ```svelte
   {#if loadedComponent}
     {@const Component = loadedComponent}
     <Component {...props} />
   {/if}
   ```

**Reaktív betöltés:**

```typescript
$effect(() => {
  const currentComponent = component;

  // Guard: ne töltsünk be újra, ha már töltünk vagy már be van töltve
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

**Állapotok:**

- `loading` - Betöltés folyamatban (spinner megjelenítése)
- `error` - Hiba történt (hibaüzenet megjelenítése)
- `loadedComponent` - Betöltött komponens (renderelés)
- `placeholder` - Nincs kiválasztott menüpont (üres állapot)
- `isLoadingComponent` - Guard flag (dupla betöltés elkerülése)
- `lastLoadedComponent` - Utoljára betöltött komponens neve (cache)

**Plugin támogatás:**

Plugin komponensek API-n keresztül töltődnek be és Web Component-ként renderelődnek:

```typescript
async function loadPluginComponent(componentName: string) {
  // 1. Komponens kód lekérése API-n keresztül
  const response = await fetch(`/api/plugins/${appName}/components/${componentName}`);
  const code = await response.text();

  // 2. Kód futtatása (factory function létrehozása)
  const script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);

  // 3. Factory meghívása és custom element tag name lekérése
  const factoryName = `${appName.replace(/-/g, '_')}_Component_${componentName}`;
  const componentFactory = window[factoryName];
  const componentInfo = componentFactory();

  // 4. Custom element renderelése
  loadedComponent = {
    __pluginTagName: componentInfo.tagName,
    __pluginProps: props
  };
}
```

**Hibakezelés:**

- Komponens nem található → Hibaüzenet megjelenítése
- Betöltési hiba → Konzol log + hibaüzenet
- Plugin betöltési hiba → Factory function hiányzik

**Performance optimalizáció:**

- Lazy loading: Csak az aktív komponens töltődik be
- Cache: `lastLoadedComponent` alapján elkerüljük az újratöltést
- Guard flag: `isLoadingComponent` megakadályozza a dupla betöltést
- `untrack()`: Elkerüljük a végtelen ciklusokat

#### 5. ActionBar

Az **ActionBar** egy opcionális funkciósáv az alkalmazás alján, ahol a komponensek gombokat és egyéb vezérlőket helyezhetnek el.

**Használat komponensben:**

```svelte
<script lang="ts">
  import { getActionBar } from '$lib/apps/actionBar.svelte';
  import { Button } from '$lib/components/ui/button';

  const actionBar = getActionBar();

  // ActionBar tartalom beállítása
  actionBar.set(myActions);
</script>

{#snippet myActions()}
  <Button onclick={handleSave}>Mentés</Button>
  <Button variant="outline" onclick={handleCancel}>Mégse</Button>
{/snippet}
```

**API:**

- `content` - Aktuális snippet (null ha nincs)
- `set(snippet)` - Snippet beállítása
- `clear()` - Tartalom törlése

**Automatikus törlés:**

Az AppLayout automatikusan törli az ActionBar tartalmát komponens váltáskor, így nem kell manuálisan kezelni.

### Menü struktúra (menu.json)

Minden alkalmazás rendelkezik egy `menu.json` fájllal, amely definiálja a menüpontokat. A menü hierarchikus struktúrát támogat, lokalizálható és jogosultság alapú szűrést biztosít.

**Példa menü struktúra:**

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

**Menüpont mezők:**

| Mező | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `labelKey` | string | Igen | Fordítási kulcs (pl. "menu.profile" → "settings.menu.profile") |
| `href` | string | Igen | URL hash (pl. "#profile"). Szülő menüpontoknál lehet "#" |
| `icon` | string | Nem | Ikon neve (Lucide vagy Phosphor, pl. "User", "Settings") |
| `component` | string | Nem* | Komponens neve a `components/` mappából (pl. "ProfileSettings") |
| `children` | array | Nem | Almenüpontok tömbje (hierarchikus menü) |
| `separator` | boolean | Nem | Elválasztó vonal (true esetén más mező nem kell) |
| `requiredPermission` | string | Nem | Szükséges jogosultság (pl. "settings.advanced.view") |
| `hideWhen` | string | Nem | Feltételes elrejtés (pl. "notDevMode", "singleLocale") |
| `props` | object | Nem | Komponensnek átadott props (pl. `{ "mode": "advanced" }`) |
| `hidden` | boolean | Nem | Menüpont elrejtése (true esetén nem jelenik meg) |

\* A `component` mező kötelező, ha a menüpontnak nincs `children` mezője és nem `separator`.

**Menü lokalizáció:**

A menü automatikusan lokalizálódik a `localizeMenuItems()` függvény segítségével:

```typescript
// Namespace: appName (pl. 'settings')
// Kulcs: labelKey (pl. 'menu.profile')
// Teljes kulcs: 'settings.menu.profile'

const menuItems = $derived.by(() => {
  void translationStore.currentLocale;
  return localizeMenuItems(appName, rawMenuData);
});
```

**Fordítások hozzáadása:**

```sql
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('settings', 'menu.profile', 'hu', 'Profil'),
  ('settings', 'menu.profile', 'en', 'Profile'),
  ('settings', 'menu.desktop', 'hu', 'Asztal'),
  ('settings', 'menu.desktop', 'en', 'Desktop');
```

**Hierarchikus menü:**

A `children` mező használatával többszintű menüt hozhatunk létre:

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

**Fontos szabályok:**

1. **Szülő menüpont href-je**: Ha van `children`, akkor a `href` lehet "#" (nem navigál)
2. **Szülő menüpont component-je**: Opcionális, ha van, akkor a szülőre kattintva is betöltődik
3. **Gyerek menüpontok**: Mindig kell `component` mező
4. **Separator**: Csak `separator: true` mező kell, más nem
5. **Ikon**: Opcionális, de ajánlott a jobb UX érdekében

**Jogosultság alapú szűrés:**

A `requiredPermission` mező használatával korlátozhatjuk a menüpontok láthatóságát:

```json
{
  "labelKey": "menu.advanced",
  "href": "#advanced",
  "component": "AdvancedSettings",
  "requiredPermission": "settings.advanced.view"
}
```

Ha a felhasználónak nincs meg a szükséges jogosultsága, a menüpont automatikusan elrejtésre kerül.

**Feltételes elrejtés:**

A `hideWhen` mező használatával feltételesen rejthetünk el menüpontokat:

```json
{
  "labelKey": "menu.language",
  "href": "#language",
  "component": "LanguageSettings",
  "hideWhen": "singleLocale"
}
```

Támogatott értékek:
- `"singleLocale"` - Elrejti, ha csak egy nyelv van a rendszerben
- `"notDevMode"` - Elrejti, ha nem fejlesztői módban fut a rendszer

### Komponens életciklus

1. **Alkalmazás indítása**
   - AppShell létrehozása
   - Menü betöltése és lokalizáció
   - Alapértelmezett menüpont kiválasztása (első component-tel rendelkező)

2. **Menüpont kattintás**
   - `handleMenuItemClick(item)` meghívása
   - `activeComponent` frissítése
   - `componentProps` beállítása
   - URL hash frissítése (section paraméter)

3. **Komponens betöltés**
   - AppContentArea `$effect` triggerelése
   - Vite glob import használata
   - Aszinkron komponens betöltés
   - Komponens renderelés props-okkal

4. **ActionBar kezelés**
   - Komponens beállítja az ActionBar-t (`actionBar.set()`)
   - ActionBar megjelenik az alkalmazás alján
   - Komponens váltáskor automatikus törlés

5. **Navigáció**
   - URL hash változás (`#profile` → `#security`)
   - AppShell `$effect` detektálja a változást
   - Megfelelő menüpont aktiválása
   - Komponens betöltés

### Többnyelvűség

A menü automatikusan lokalizálódik a `localizeMenuItems` függvény segítségével:

```typescript
// Namespace: appName (pl. 'settings')
// Kulcs: labelKey (pl. 'menu.profile')
// Teljes kulcs: 'settings.menu.profile'

const menuItems = $derived.by(() => {
  void translationStore.currentLocale;
  return localizeMenuItems(appName, rawMenuData);
});
```

**Fordítások:**

```sql
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('settings', 'menu.profile', 'hu', 'Profil'),
  ('settings', 'menu.profile', 'en', 'Profile');
```

### Jogosultság ellenőrzés

A menüpontok automatikusan szűrődnek a felhasználó jogosultságai alapján:

```typescript
// menu.json
{
  "labelKey": "menu.advanced",
  "requiredPermission": "settings.advanced.view",
  // ...
}
```

Ha a felhasználónak nincs meg a szükséges jogosultsága, a menüpont nem jelenik meg.

### URL paraméterek

Az alkalmazások támogatják a `section` paramétert az URL hash-ben:

```typescript
// Ablak megnyitása section paraméterrel
windowManager.openWindow('settings', 'Beállítások', settingsApp, {
  section: 'profile'  // → #profile menüpont aktiválása
});
```

Az AppShell automatikusan detektálja a section paramétert és aktiválja a megfelelő menüpontot.

## Beépített alkalmazások listája

### 1. Beállítások (Settings)

Rendszer és felhasználói beállítások kezelése.

**Főbb funkciók:**
- Profil beállítások
- Megjelenés (téma, nyelv)
- Biztonság (jelszó, 2FA)
- Téma előnézetek

**Menü struktúra:** 3 fő kategória, 11 komponens

[Részletes dokumentáció →](/hu/builtin-apps/settings)

### 2. Felhasználók (Users)

Felhasználók, csoportok, szerepkörök és jogosultságok kezelése.

**Főbb funkciók:**
- Felhasználó CRUD
- Csoport kezelés
- Szerepkör kezelés
- Jogosultság kezelés
- Erőforrás kezelés

**Jogosultság:** Csak admin felhasználók

[Részletes dokumentáció →](/hu/builtin-apps/users)

### 3. Chat

Valós idejű üzenetküldő rendszer Socket.IO-val.

**Főbb funkciók:**
- Valós idejű üzenetküldés
- Online/offline státusz
- Gépelés jelzés
- Olvasatlan üzenetek
- Toast értesítések

**Technológia:** Socket.IO + REST API fallback

[Részletes dokumentáció →](/hu/builtin-apps/chat)

### 4. Naplók (Log)

Rendszer és hibanaplók megjelenítése.

**Főbb funkciók:**
- Hibanaplók táblázatos megjelenítése
- Szűrés log szint szerint
- Szűrés forrás szerint
- Rendezés és lapozás

**Jogosultság:** `log.error.view` (admin)

[Részletes dokumentáció →](/hu/builtin-apps/log)

### 5. Plugin Manager

Plugin telepítés, kezelés és eltávolítás.

**Főbb funkciók:**
- Plugin feltöltés (.elyospkg)
- Plugin validáció
- Telepített pluginek listája
- Plugin részletek
- Plugin eltávolítás

**Jogosultság:** `plugin.manual.install` (admin)

[Részletes dokumentáció →](/hu/builtin-apps/plugin-manager)

### 6. Súgó (Help)

Kontextusfüggő súgó rendszer.

**Állapot:** Fejlesztés alatt

**Tervezett funkciók:**
- Kontextusfüggő súgó
- Súgó gomb az ablakokban
- Keresés a súgó tartalomban
- Többnyelvű tartalom

[Részletes dokumentáció →](/hu/builtin-apps/help)

## Új alkalmazás létrehozása

### 1. Alapstruktúra

```
apps/my-app/
├── index.svelte              # Fő belépési pont
├── icon.svg                  # Alkalmazás ikon
├── menu.json                 # Menü definíció
├── my-app.remote.ts          # Server actions
├── components/               # UI komponensek
│   ├── Component1.svelte
│   └── Component2.svelte
└── stores/                   # Állapotkezelés (opcionális)
    └── myAppStore.svelte.ts
```

### 2. index.svelte létrehozása

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

### 3. menu.json létrehozása

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

### 4. Komponensek létrehozása

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
  <Button onclick={handleAction}>Művelet</Button>
{/snippet}

<div class="title-block">
  <h2>Áttekintés</h2>
  <h3>Alkalmazás áttekintő oldal</h3>
</div>

<p>Tartalom...</p>
```

### 5. Fordítások hozzáadása

```sql
-- packages/database/src/seeds/translations/my-app.ts
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('my-app', 'title', 'hu', 'Saját Alkalmazás'),
  ('my-app', 'title', 'en', 'My App'),
  ('my-app', 'menu.overview', 'hu', 'Áttekintés'),
  ('my-app', 'menu.overview', 'en', 'Overview');
```

### 6. Alkalmazás regisztrálása

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

## Best practice-ek

1. **Egységes menü struktúra**: Használj értelmes href-eket (#profile, #security)
2. **Komponens nevek**: PascalCase (ProfileSettings.svelte)
3. **ActionBar használat**: Csak akkor, ha szükséges (mentés, mégse gombok)
4. **Fordítások**: Mindig adj meg magyar és angol verziót
5. **Jogosultságok**: Használj `requiredPermission`-t érzékeny menüpontoknál
6. **Ikon választás**: Használj konzisztens ikonokat (Lucide vagy Phosphor)
7. **Props átadás**: Használd a `props` mezőt a menu.json-ban
8. **Hibakezelés**: Kezeld le a komponens betöltési hibákat
9. **Loading állapot**: Jelenítsd meg a betöltési állapotot
10. **Responsive design**: Tervezz mobil nézetekre is

## Hibaelhárítás

### Komponens nem töltődik be

**Probléma**: "Komponens nem található" hiba.

**Megoldás**:
1. Ellenőrizd a komponens nevét a menu.json-ban
2. Ellenőrizd, hogy a komponens létezik-e a `components/` mappában
3. Nézd meg a böngésző konzolt részletes hibáért

### Menü nem jelenik meg

**Probléma**: A sidebar üres.

**Megoldás**:
1. Ellenőrizd a menu.json szintaxisát
2. Nézd meg a fordításokat (namespace + labelKey)
3. Ellenőrizd a jogosultságokat

### ActionBar nem jelenik meg

**Probléma**: Az ActionBar nem látszik.

**Megoldás**:
1. Ellenőrizd, hogy meghívtad-e az `actionBar.set()`-et
2. Nézd meg, hogy a snippet helyesen van-e definiálva
3. Ellenőrizd, hogy az AppLayout rendereli-e az ActionBar-t
