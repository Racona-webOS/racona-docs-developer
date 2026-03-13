---
title: Plugin Manager alkalmazás
description: Plugin telepítés, kezelés és eltávolítás
---

A Plugin Manager alkalmazás lehetővé teszi harmadik féltől származó pluginek telepítését, kezelését és eltávolítását. Az alkalmazás támogatja a manuális feltöltést, validációt és a telepített pluginek részletes megjelenítését.

## Áttekintés

A Plugin Manager négy fő részből áll:
- **Plugin Store** - Plugin áruház (fejlesztés alatt)
- **Telepített pluginek** - Telepített pluginek listája és kezelése
- **Manuális telepítés** - `.elyospkg` fájlok feltöltése
- **Dev pluginek** - Fejlesztői pluginek betöltése (csak dev mode-ban)

### Főbb funkciók

- Plugin feltöltés drag & drop-pal vagy fájl böngészővel
- Plugin validáció telepítés előtt
- Telepített pluginek listázása szűrőkkel
- Plugin részletek megtekintése (verzió, szerző, jogosultságok, függőségek)
- Plugin eltávolítás
- Jogosultság alapú hozzáférés
- Dev mode plugin betöltés

## Fájl struktúra

```
apps/plugin-manager/
├── index.svelte              # Fő layout (AppLayout + menü)
├── menu.json                 # Menü definíció
├── plugins.remote.ts         # Server actions (lista, részletek, eltávolítás)
├── components/
│   ├── PluginStore.svelte    # Plugin áruház (placeholder)
│   ├── PluginList.svelte     # Telepített pluginek táblázat
│   ├── pluginListColumns.ts  # Táblázat oszlopdefiníciók
│   ├── PluginDetail.svelte   # Plugin részletek
│   ├── PluginUpload.svelte   # Plugin feltöltés
│   ├── PluginPreview.svelte  # Plugin előnézet telepítés előtt
│   ├── DevPlugins.svelte     # Dev pluginek lista
│   └── DevPluginLoader.svelte # Dev plugin betöltő
└── types/
    └── ...                   # Plugin típusok
```

## Menü struktúra

A `menu.json` definiálja az alkalmazás menüpontjait:

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

**Jogosultságok:**
- `plugin.manual.install` - Plugin feltöltés és eltávolítás (csak admin)

**Feltételes megjelenítés:**
- Dev Pluginek menüpont csak dev mode-ban látható (`hideWhen: "notDevMode"`)

## Server Actions

### `plugins.remote.ts`

#### 1. `fetchPlugins` (command)

Telepített pluginek lekérése szűrési és lapozási paraméterekkel.

```typescript
const result = await fetchPlugins({
  page: 1,
  pageSize: 20,
  sortBy: 'name',           // 'name' | 'version' | 'installedAt' | 'status'
  sortOrder: 'asc',         // 'asc' | 'desc'
  search: 'my-plugin',      // opcionális
  status: 'active'          // opcionális, 'active' | 'inactive'
});
```

**Validáció:**
- `page`: minimum 1, alapértelmezett: 1
- `pageSize`: 1-100 között, alapértelmezett: 20
- `sortBy`: string, alapértelmezett: 'name'
- `sortOrder`: 'asc' | 'desc', alapértelmezett: 'asc'
- `search`: string (ILIKE keresés appId, name, description mezőkben)
- `status`: 'active' | 'inactive'

**Visszatérési érték:**

```typescript
{
  success: true,
  data: PluginListItem[],
  pagination: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
  }
}
```

**PluginListItem típus:**

```typescript
interface PluginListItem {
  id: number;
  appId: string;
  name: string;              // Lokalizált név
  version: string;
  author: string | null;
  status: string;            // 'active' | 'inactive'
  installedAt: Date | null;
  description: string | null;
}
```

#### 2. `fetchPluginDetail` (command)

Plugin részletes információinak lekérése.

```typescript
const result = await fetchPluginDetail({
  pluginId: 'my-plugin'
});
```

**Visszatérési érték:**

```typescript
{
  success: true,
  data: PluginDetail
}
```

**PluginDetail típus:**

```typescript
interface PluginDetail {
  id: number;
  appId: string;
  name: Record<string, string>;              // Többnyelvű név
  description: Record<string, string> | null; // Többnyelvű leírás
  version: string;
  icon: string;
  category: string;
  author: string | null;
  pluginAuthor: string | null;
  pluginDescription: string | null;
  pluginPermissions: string[] | null;        // Kért jogosultságok
  pluginDependencies: Record<string, string> | null; // Függőségek
  pluginMinWebosVersion: string | null;      // Minimum WebOS verzió
  pluginStatus: string;                      // 'active' | 'inactive'
  pluginInstalledAt: Date | null;
  pluginUpdatedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. `uninstallPlugin` (command)

Plugin eltávolítása a rendszerből.

```typescript
const result = await uninstallPlugin({
  pluginId: 'my-plugin'
});
```

**Jogosultság ellenőrzés:**
- Ellenőrzi, hogy a felhasználónak van-e `plugin.manual.install` jogosultsága

**Működés:**
1. Ellenőrzi, hogy a plugin létezik-e
2. Törli a plugin fájlokat a fájlrendszerből
3. Törli a plugin bejegyzést az adatbázisból
4. Visszaadja a sikeres vagy sikertelen eredményt

**Visszatérési érték:**

```typescript
{
  success: true
}
```

## Komponensek

### PluginList.svelte

Telepített pluginek megjelenítése DataTable komponenssel.

**Állapot:**

```typescript
let data = $state<PluginListItem[]>([]);
let loading = $state(false);
let paginationInfo = $state<PaginationInfo>({
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0
});
let tableState = $state<DataTableState>({
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc'
});
let statusFilter = $state<string[]>([]);
let searchFilter = $state('');
```

**Szűrők:**

1. **Status filter** - Faceted filter komponens
   - Aktív / Inaktív pluginek szűrése

2. **Search filter** - Input mező
   - 300ms debounce
   - Keresés appId, név és leírás mezőkben

**Táblázat oszlopok:**
- Név (rendezés támogatott)
- Verzió (rendezés támogatott)
- Szerző
- Státusz (rendezés támogatott, színkódolt badge)
- Telepítés dátuma (rendezés támogatott)
- Műveletek (Megnyitás gomb)

**Navigáció:**

```typescript
function handleOpenPlugin(plugin: PluginListItem) {
  shell.navigateTo('PluginDetail', { pluginId: plugin.appId }, '#installed');
}
```

### PluginUpload.svelte

Plugin feltöltés drag & drop-pal vagy fájl böngészővel.

**Konfiguráció:**

```typescript
const PLUGIN_EXTENSION = '.elyospkg';
const MAX_SIZE_MB = 10;
```

**Állapot:**

```typescript
let selectedFile = $state<File | null>(null);
let isDragging = $state(false);
let isUploading = $state(false);
let uploadProgress = $state(0);
let uploadStatus = $state<'idle' | 'uploading' | 'success' | 'error'>('idle');
let statusMessage = $state('');
let errorDetails = $state<string[]>([]);
```

**Validációk:**

1. **Fájl kiterjesztés** - Csak `.elyospkg` fájlok
2. **Fájl méret** - Maximum 10 MB

**Feltöltési folyamat:**

1. Fájl kiválasztása (drag & drop vagy böngésző)
2. Validáció (kiterjesztés, méret)
3. Feltöltés a `/api/plugins/validate` végpontra
4. Szerver oldali validáció
5. Navigáció a `PluginPreview` komponenshez

**API hívás:**

```typescript
const formData = new FormData();
formData.append('file', selectedFile);

const response = await fetch('/api/plugins/validate', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (response.ok && result.success) {
  // Navigáció előnézethez
  shell.navigateTo('PluginPreview', {
    tempFile: result.tempFile,
    manifest: result.manifest,
    warnings: result.warnings || []
  });
}
```

### PluginDetail.svelte

Plugin részletes információinak megjelenítése.

**Props:**

```typescript
interface Props {
  pluginId: string;
  returnTo?: string;  // Alapértelmezett: 'PluginList'
}
```

**Megjelenített információk:**

1. **Alapvető információk**
   - Státusz (badge)
   - App ID (monospace)
   - Verzió
   - Kategória

2. **Részletek**
   - Szerző
   - Leírás

3. **Jogosultságok**
   - Kért jogosultságok listája (badge-ekkel)
   - Shield ikon minden jogosultságnál

4. **Függőségek**
   - Függőség név és verzió
   - Badge formátumban

5. **Rendszer információk**
   - Minimum WebOS verzió
   - Telepítés dátuma
   - Frissítés dátuma

**Action Bar:**

```typescript
{#snippet pluginActions()}
  <IconButton
    variant="destructive"
    text={t('plugin-manager.detail.uninstall')}
    onclick={handleUninstallClick}
  >
    {#snippet icon()}<Trash2 />{/snippet}
  </IconButton>
{/snippet}
```

**Eltávolítás megerősítés:**

```svelte
<ConfirmDialog
  bind:open={uninstallDialogOpen}
  title={t('plugin-manager.detail.uninstallTitle')}
  description={t('plugin-manager.detail.uninstallDescription', { name })}
  confirmText={t('plugin-manager.detail.uninstallConfirm')}
  cancelText={t('common.buttons.cancel')}
  confirmVariant="destructive"
  onConfirm={confirmUninstall}
  onCancel={cancelUninstall}
/>
```

**Eltávolítás után:**

```typescript
async function confirmUninstall() {
  const result = await uninstallPlugin({ pluginId: plugin.appId });

  if (result.success) {
    toast.success(t('plugin-manager.detail.uninstallSuccess'));

    // App registry frissítése
    const appRegistry = getClientAppRegistry();
    await appRegistry.refresh();

    // Navigáció vissza a listához
    shell.navigateTo(returnTo);
  }
}
```

### PluginPreview.svelte

Plugin előnézet telepítés előtt (manifest információk megjelenítése).

**Props:**

```typescript
interface Props {
  tempFile: string;           // Ideiglenes fájl elérési út
  manifest: PluginManifest;   // Plugin manifest
  warnings: string[];         // Validációs figyelmeztetések
}
```

**Funkciók:**
- Manifest információk megjelenítése
- Figyelmeztetések megjelenítése
- Telepítés megerősítése
- Telepítés megszakítása

### DevPlugins.svelte

Fejlesztői pluginek listája és betöltése (csak dev mode-ban).

**Funkciók:**
- Fejlesztői pluginek listázása
- Plugin betöltés a fájlrendszerből
- Hot reload támogatás

### PluginStore.svelte

Plugin áruház (fejlesztés alatt).

```svelte
<h2>{t('plugin-manager.store.title')}</h2>
```

## Plugin rendszer

### Plugin struktúra

Egy plugin egy `.elyospkg` fájl, amely egy ZIP archívum a következő struktúrával:

```
my-plugin.elyospkg
├── manifest.json         # Plugin metaadatok
├── index.html           # Plugin belépési pont (Web Component)
├── icon.svg             # Plugin ikon
├── assets/              # Statikus fájlok
│   ├── styles.css
│   └── script.js
└── locales/             # Fordítások (opcionális)
    ├── hu.json
    └── en.json
```

### Manifest.json

```json
{
  "id": "my-plugin",
  "name": {
    "hu": "Saját Plugin",
    "en": "My Plugin"
  },
  "description": {
    "hu": "Plugin leírás",
    "en": "Plugin description"
  },
  "version": "1.0.0",
  "author": "Fejlesztő Neve",
  "category": "productivity",
  "icon": "icon.svg",
  "entryPoint": "index.html",
  "permissions": [
    "storage.read",
    "storage.write",
    "notifications.send"
  ],
  "dependencies": {
    "another-plugin": "^2.0.0"
  },
  "minWebosVersion": "1.0.0"
}
```

### Plugin validáció

A `/api/plugins/validate` végpont validálja a feltöltött plugint:

1. **Fájl formátum** - ZIP archívum
2. **Manifest létezik** - `manifest.json` fájl megléte
3. **Manifest séma** - Kötelező mezők ellenőrzése
4. **Duplikáció** - Plugin ID egyediség
5. **Függőségek** - Függőségek elérhetősége
6. **Verzió kompatibilitás** - Minimum WebOS verzió ellenőrzése
7. **Jogosultságok** - Érvényes jogosultságok

**Validációs hibák:**

```typescript
{
  success: false,
  error: 'Validation failed',
  errors: [
    { code: 'INVALID_MANIFEST', message: 'manifest.json is missing' },
    { code: 'DUPLICATE_ID', message: 'Plugin with ID already exists' },
    { code: 'MISSING_DEPENDENCY', message: 'Dependency not found' }
  ]
}
```

**Validációs figyelmeztetések:**

```typescript
{
  success: true,
  tempFile: '/tmp/plugin-xyz.elyospkg',
  manifest: { /* ... */ },
  warnings: [
    'Plugin requests storage.write permission',
    'Plugin has no localization files'
  ]
}
```

### Plugin telepítés

A telepítési folyamat lépései:

1. **Validáció** - Manifest és függőségek ellenőrzése
2. **Kicsomagolás** - ZIP fájl kicsomagolása a plugin könyvtárba
3. **Adatbázis bejegyzés** - Plugin metaadatok mentése
4. **Jogosultságok** - Kért jogosultságok regisztrálása
5. **App registry frissítés** - Plugin hozzáadása a start menühöz

**Plugin könyvtár:**

```
/plugins/
├── my-plugin/
│   ├── manifest.json
│   ├── index.html
│   ├── icon.svg
│   └── assets/
└── another-plugin/
    └── ...
```

### Plugin betöltés

A pluginek Web Component-ként töltődnek be:

```typescript
// Plugin betöltés
const pluginUrl = `/plugins/${pluginId}/index.html`;
const iframe = document.createElement('iframe');
iframe.src = pluginUrl;
iframe.sandbox = 'allow-scripts allow-same-origin';
container.appendChild(iframe);
```

**Sandbox korlátozások:**
- `allow-scripts` - JavaScript futtatás
- `allow-same-origin` - Same-origin policy
- Nincs `allow-top-navigation` - Nem navigálhat el a főoldalról

## Adatbázis séma

### `apps` tábla (plugin mezők)

```typescript
{
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 100 }).notNull().unique(),
  appType: varchar('app_type', { length: 20 }).notNull(), // 'plugin'
  name: jsonb('name').notNull(),                          // Többnyelvű
  description: jsonb('description'),                      // Többnyelvű
  version: varchar('version', { length: 20 }).notNull(),
  icon: varchar('icon', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  author: varchar('author', { length: 255 }),

  // Plugin specifikus mezők
  pluginAuthor: varchar('plugin_author', { length: 255 }),
  pluginDescription: text('plugin_description'),
  pluginPermissions: jsonb('plugin_permissions'),         // string[]
  pluginDependencies: jsonb('plugin_dependencies'),       // Record<string, string>
  pluginMinWebosVersion: varchar('plugin_min_webos_version', { length: 20 }),
  pluginStatus: varchar('plugin_status', { length: 20 }), // 'active' | 'inactive'
  pluginInstalledAt: timestamp('plugin_installed_at'),
  pluginUpdatedAt: timestamp('plugin_updated_at'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}
```

## Használati példák

### Pluginek listázása

```typescript
import { fetchPlugins } from '$apps/plugin-manager/plugins.remote';

const result = await fetchPlugins({
  page: 1,
  pageSize: 20,
  status: 'active',
  sortBy: 'name',
  sortOrder: 'asc'
});

if (result.success) {
  console.log('Plugins:', result.data);
  console.log('Total:', result.pagination.totalCount);
}
```

### Plugin részletek lekérése

```typescript
import { fetchPluginDetail } from '$apps/plugin-manager/plugins.remote';

const result = await fetchPluginDetail({
  pluginId: 'my-plugin'
});

if (result.success && result.data) {
  console.log('Plugin:', result.data);
  console.log('Permissions:', result.data.pluginPermissions);
  console.log('Dependencies:', result.data.pluginDependencies);
}
```

### Plugin eltávolítása

```typescript
import { uninstallPlugin } from '$apps/plugin-manager/plugins.remote';
import { toast } from 'svelte-sonner';

const result = await uninstallPlugin({
  pluginId: 'my-plugin'
});

if (result.success) {
  toast.success('Plugin eltávolítva');

  // App registry frissítése
  const appRegistry = getClientAppRegistry();
  await appRegistry.refresh();
} else {
  toast.error(result.error);
}
```

### Plugin feltöltés programozottan

```typescript
const file = new File([blob], 'my-plugin.elyospkg', {
  type: 'application/zip'
});

const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/plugins/validate', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.success) {
  console.log('Manifest:', result.manifest);
  console.log('Warnings:', result.warnings);

  // Telepítés
  const installResponse = await fetch('/api/plugins/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tempFile: result.tempFile
    })
  });
}
```

## Fordítások

A Plugin Manager fordításai a `translations.plugin-manager` namespace-ben találhatók:

```sql
-- packages/database/src/seeds/translations/plugin-manager.ts
INSERT INTO translations (namespace, key, locale, value) VALUES
  ('plugin-manager', 'title', 'hu', 'Plugin Manager'),
  ('plugin-manager', 'title', 'en', 'Plugin Manager'),
  ('plugin-manager', 'menu.store', 'hu', 'Áruház'),
  ('plugin-manager', 'menu.store', 'en', 'Store'),
  ('plugin-manager', 'menu.installed', 'hu', 'Telepített'),
  ('plugin-manager', 'menu.installed', 'en', 'Installed'),
  -- ...
```

## Best practice-ek

1. **Validáció**: Mindig validáld a plugint telepítés előtt
2. **Jogosultságok**: Csak a szükséges jogosultságokat kérd
3. **Függőségek**: Dokumentáld a plugin függőségeit
4. **Verziókezelés**: Használj szemantikus verziószámozást (semver)
5. **Sandbox**: Használj sandbox-ot a plugin izolálásához
6. **Hibakezelés**: Kezeld le a plugin betöltési hibákat
7. **Teljesítmény**: Optimalizáld a plugin méretét
8. **Dokumentáció**: Adj részletes leírást és használati útmutatót

## Hibaelhárítás

### Plugin nem jelenik meg a listában

**Probléma**: Feltöltött plugin nem látszik a telepített pluginek között.

**Megoldás**:
1. Ellenőrizd az `apps` táblát - `appType = 'plugin'`
2. Nézd meg a `pluginStatus` mezőt - lehet, hogy 'inactive'
3. Ellenőrizd a jogosultságokat
4. Frissítsd az app registry-t

### Plugin feltöltés sikertelen

**Probléma**: Plugin feltöltés hibával tér vissza.

**Megoldás**:
1. Ellenőrizd a fájl kiterjesztést (`.elyospkg`)
2. Ellenőrizd a fájl méretet (max 10 MB)
3. Nézd meg a `manifest.json` fájlt - érvényes JSON?
4. Ellenőrizd a kötelező mezőket (id, name, version, stb.)
5. Nézd meg a szerver naplókat

### Plugin eltávolítás nem működik

**Probléma**: Plugin eltávolítás hibával tér vissza.

**Megoldás**:
1. Ellenőrizd a jogosultságokat (`plugin.manual.install`)
2. Nézd meg a fájlrendszer jogosultságokat
3. Ellenőrizd, hogy a plugin könyvtár létezik-e
4. Nézd meg a szerver naplókat

### Plugin nem töltődik be

**Probléma**: Plugin telepítve van, de nem töltődik be.

**Megoldás**:
1. Ellenőrizd a `manifest.json` `entryPoint` mezőjét
2. Nézd meg a böngésző konzolt hibákért
3. Ellenőrizd a sandbox beállításokat
4. Nézd meg a plugin fájlokat a `/plugins/` könyvtárban
