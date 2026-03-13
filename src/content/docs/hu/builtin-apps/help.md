---
title: Súgó alkalmazás
description: Kontextusfüggő súgó rendszer alkalmazásokhoz
---

:::caution[Fejlesztés alatt]
A Súgó alkalmazás jelenleg fejlesztés alatt áll. Az alapvető infrastruktúra elkészült (súgó gomb az ablakokban, paraméter átadás), de a tényleges súgó tartalom megjelenítő rendszer még nem teljes. Ez a dokumentáció a tervezett működést és a már implementált részeket ismerteti.
:::

A Súgó alkalmazás egy kontextusfüggő súgó rendszer, amely lehetővé teszi, hogy minden alkalmazáshoz egyedi súgó tartalom tartozzon. A súgó elérhető az ablak fejlécében található súgó gomb segítségével.

## Áttekintés

A súgó rendszer két fő részből áll:
- **Súgó gomb az ablakokban** - Minden ablak fejlécében megjelenhet egy súgó gomb
- **Súgó alkalmazás** - Megjeleníti a kontextusfüggő súgó tartalmat

### Főbb funkciók (tervezett)

- Kontextusfüggő súgó minden alkalmazáshoz
- Súgó gomb az ablak fejlécében
- Automatikus címsor frissítés (pl. "Súgó - Beállítások")
- Többnyelvű súgó tartalom
- Keresés a súgó tartalomban
- Navigáció a súgó témák között

## Fájl struktúra

```
apps/help/
├── index.svelte              # Fő komponens (jelenleg placeholder)
├── icon.svg                  # Súgó ikon
├── components/               # Súgó komponensek (fejlesztés alatt)
├── stores/                   # Súgó állapotkezelés (fejlesztés alatt)
├── types/                    # Típusdefiníciók
└── utils/                    # Segédfüggvények
```

## Súgó rendszer használata

### 1. Súgó ID hozzáadása az alkalmazáshoz

Az alkalmazás metaadataiban kell megadni a `helpId` mezőt:

```typescript
// apps/settings/index.svelte vagy app registry
const appMetadata: AppMetadata = {
  appName: 'settings',
  title: 'Beállítások',
  defaultSize: { width: 800, height: 600 },
  icon: 'icon.svg',
  helpId: 1,  // Súgó azonosító
  // ...
};
```

### 2. Súgó gomb megjelenítése

A súgó gomb automatikusan megjelenik az ablak fejlécében, ha az alkalmazás metaadataiban meg van adva a `helpId`:

```typescript
// Window.svelte (automatikus)
{#if windowState.helpId}
  <WindowControlButton
    controlType="help"
    onClick={() => help(windowState.helpId)}
  />
{/if}
```

### 3. Súgó megnyitása

Amikor a felhasználó a súgó gombra kattint, a rendszer megnyitja a Súgó alkalmazást a megfelelő `helpId` paraméterrel:

```typescript
async function help(helpId: number | undefined) {
  const helpApp = await getAppByName('help');
  if (helpApp) {
    windowManager.openWindow(helpApp.appName, helpApp.title, helpApp, {
      helpId  // Paraméter átadása
    });
  }
}
```

## Jelenlegi implementáció

### Help alkalmazás (index.svelte)

A jelenlegi implementáció egy egyszerű placeholder:

```svelte
<script lang="ts">
  import { getParameter, getWindowId } from '$lib/services/client/appContext';
  import { getWindowManager } from '$lib/stores';

  const helpId = getParameter<number | undefined>('helpId', undefined);

  // Hardcoded példa adatok (ideiglenes)
  const helps = [
    {
      id: 1,
      title: 'Beállítások',
      content: 'Beállítások súgó tartalom lesz ez.'
    },
    {
      id: 2,
      title: 'Felhasználók',
      content: 'Felhasználók súgó tartalom lesz ez.'
    },
    // ...
  ];

  const help = helps.find((h) => h.id === helpId);

  // Ablak címsor frissítése
  if (help) {
    const windowManager = getWindowManager();
    const windowId = getWindowId();
    const windowData = windowManager.windows.find((w) => w.id === windowId);
    if (windowData) {
      windowManager.updateWindowTitle(windowId, windowData.title + ' - ' + help.title);
    }
  }
</script>

<div>
  {#if helpId}
    {#if help}
      <p>{help.content}</p>
    {:else}
      <p>Nem található súgó</p>
    {/if}
  {:else}
    <p>Általános súgó alkalmazás tartalom.</p>
  {/if}
</div>
```

## Típusok

### AppMetadata (helpId mező)

```typescript
// lib/types/window.ts
export interface AppMetadata {
  appName: string;
  title: string;
  defaultSize: WindowSize;
  icon?: string;
  // ...
  helpId?: number;  // Súgó azonosító
  // ...
}
```

### WindowState (helpId mező)

```typescript
// lib/stores/windowStore.svelte.ts
export type WindowState = {
  id: string;
  appName: string;
  title: string;
  // ...
  helpId?: number;  // Súgó azonosító
  parameters?: AppParameters;
  // ...
};
```

### AppParameters

```typescript
// lib/types/window.ts
export interface AppParameters {
  [key: string]: unknown;
}

// Példa használat
const parameters: AppParameters = {
  helpId: 1
};
```

## Tervezett funkciók

### Súgó tartalom struktúra

A súgó tartalom a következő struktúrában lesz tárolva (tervezet):

```typescript
interface HelpContent {
  id: number;
  appName: string;
  title: Record<string, string>;        // Többnyelvű cím
  content: Record<string, string>;      // Többnyelvű tartalom (Markdown)
  sections?: HelpSection[];             // Alszekciók
  keywords?: string[];                  // Keresési kulcsszavak
  relatedTopics?: number[];             // Kapcsolódó témák ID-i
  createdAt: Date;
  updatedAt: Date;
}

interface HelpSection {
  id: string;
  title: Record<string, string>;
  content: Record<string, string>;
  order: number;
}
```

### Súgó tartalom tárolása

A súgó tartalmak **adatbázisban** lesznek tárolva. Ez lehetővé teszi, hogy:

- Új súgó tartalmak hozzáadása alkalmazás újraindítás nélkül
- Súgó tartalmak módosítása build és deploy nélkül
- Dinamikus tartalom kezelés admin felületen keresztül
- Verziókövetés és audit trail a változásokról

**Formátum**: A tartalom formátuma (Markdown, HTML, vagy egyéb) még nem végleges, de valószínűleg **Markdown** lesz a választott formátum a könnyű szerkeszthetőség miatt.

**Adatbázis séma** (tervezet):

```sql
CREATE TABLE help_contents (
  id SERIAL PRIMARY KEY,
  help_id INTEGER UNIQUE NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  title JSONB NOT NULL,              -- Többnyelvű cím
  content JSONB NOT NULL,            -- Többnyelvű tartalom (Markdown)
  sections JSONB,                    -- Alszekciók
  keywords TEXT[],                   -- Keresési kulcsszavak
  related_topics INTEGER[],          -- Kapcsolódó témák ID-i
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Súgó komponensek (tervezett)

```
components/
├── HelpBrowser.svelte        # Fő böngésző komponens
├── HelpContent.svelte        # Tartalom megjelenítő (Markdown)
├── HelpNavigation.svelte     # Navigáció (TOC)
├── HelpSearch.svelte         # Keresés
└── RelatedTopics.svelte      # Kapcsolódó témák
```

### Server Actions (tervezett)

```typescript
// help.remote.ts

// Súgó tartalom lekérése
export const fetchHelpContent = command(
  v.object({ helpId: v.number() }),
  async ({ helpId }) => {
    // Súgó tartalom lekérése adatbázisból vagy fájlból
    const content = await helpRepository.findById(helpId);
    return { success: true, content };
  }
);

// Súgó keresés
export const searchHelp = command(
  v.object({ query: v.string() }),
  async ({ query }) => {
    // Keresés a súgó tartalmakban
    const results = await helpRepository.search(query);
    return { success: true, results };
  }
);

// Kapcsolódó témák lekérése
export const fetchRelatedTopics = command(
  v.object({ helpId: v.number() }),
  async ({ helpId }) => {
    const topics = await helpRepository.findRelated(helpId);
    return { success: true, topics };
  }
);
```

## Használati példák

### Súgó hozzáadása új alkalmazáshoz

1. **Súgó ID meghatározása**

Válassz egy egyedi súgó ID-t az alkalmazásodhoz (pl. 10 = Settings, 20 = Users, stb.)

2. **Súgó ID hozzáadása az app metaadatokhoz**

```typescript
// apps/my-app/index.svelte
const appMetadata: AppMetadata = {
  appName: 'my-app',
  title: 'Saját Alkalmazás',
  defaultSize: { width: 800, height: 600 },
  helpId: 100,  // Egyedi súgó ID
  // ...
};
```

3. **Súgó tartalom létrehozása** (amikor a rendszer elkészül)

```typescript
// Adatbázis seed vagy admin felület
const helpContent: HelpContent = {
  id: 100,
  appName: 'my-app',
  title: {
    hu: 'Saját Alkalmazás Súgó',
    en: 'My App Help'
  },
  content: {
    hu: '# Saját Alkalmazás\n\nEz az alkalmazás...',
    en: '# My App\n\nThis application...'
  },
  keywords: ['app', 'alkalmazás', 'help'],
  // ...
};
```

### Súgó megnyitása programozottan

```typescript
import { getWindowManager } from '$lib/stores';
import { getAppByName } from '$lib/services/client/appRegistry';

async function openHelp(helpId: number) {
  const windowManager = getWindowManager();
  const helpApp = await getAppByName('help');

  if (helpApp) {
    windowManager.openWindow(helpApp.appName, helpApp.title, helpApp, {
      helpId
    });
  }
}

// Használat
openHelp(100);
```

### Súgó link komponens használata

```svelte
<script>
  import WindowLink from '$lib/components/ui/WindowLink.svelte';
</script>

<WindowLink appName="help" parameters={{ helpId: 100 }}>
  Súgó megnyitása
</WindowLink>
```

## Súgó ID konvenciók

Javasolt súgó ID tartományok:

- **1-99**: Rendszer alkalmazások
  - 1: Beállítások
  - 2: Felhasználók
  - 3: Súgó (meta)
  - 10: Chat
  - 20: Naplók
  - 30: Plugin Manager

- **100-999**: Beépített alkalmazások

- **1000+**: Plugin alkalmazások
  - 1000: Általános plugin súgó
  - 1001+: Egyedi plugin súgók

## Ablak címsor frissítés

A súgó alkalmazás automatikusan frissíti az ablak címsorát, hogy tartalmazza a súgó témát:

```typescript
// Eredeti cím: "Súgó"
// Frissített cím: "Súgó - Beállítások"

const windowManager = getWindowManager();
const windowId = getWindowId();
const windowData = windowManager.windows.find((w) => w.id === windowId);

if (windowData && help) {
  windowManager.updateWindowTitle(
    windowId,
    windowData.title + ' - ' + help.title
  );
}
```

## Többnyelvűség

A súgó tartalom többnyelvű lesz, a rendszer i18n rendszerével integrálva:

```typescript
// Aktuális nyelv lekérése
const { locale } = useI18n();

// Lokalizált tartalom megjelenítése
const localizedTitle = help.title[locale] || help.title['hu'];
const localizedContent = help.content[locale] || help.content['hu'];
```

## Best practice-ek

1. **Egyedi súgó ID-k**: Minden alkalmazásnak egyedi súgó ID-t adj
2. **Értelmes tartomány**: Használd a javasolt ID tartományokat
3. **Többnyelvű tartalom**: Mindig adj meg magyar és angol verziót
4. **Markdown formátum**: Használj Markdown-t a súgó tartalom formázásához
5. **Kulcsszavak**: Add meg a releváns kulcsszavakat a kereséshez
6. **Kapcsolódó témák**: Linkeld össze a kapcsolódó súgó témákat
7. **Képernyőképek**: Használj képernyőképeket az illusztrációhoz
8. **Frissítés**: Tartsd naprakészen a súgó tartalmat az alkalmazás változásaival

## Fejlesztési terv

A Súgó alkalmazás fejlesztésének következő lépései:

1. ✅ Súgó gomb az ablakokban
2. ✅ Paraméter átadás (helpId)
3. ✅ Ablak címsor frissítés
4. ⏳ Súgó tartalom adatbázis séma
5. ⏳ Súgó tartalom CRUD műveletek
6. ⏳ Markdown renderelés
7. ⏳ Navigáció és TOC
8. ⏳ Keresés funkció
9. ⏳ Kapcsolódó témák
10. ⏳ Admin felület súgó szerkesztéshez

## Hibaelhárítás

### Súgó gomb nem jelenik meg

**Probléma**: Az ablak fejlécében nem látszik a súgó gomb.

**Megoldás**:
1. Ellenőrizd, hogy az alkalmazás metaadataiban meg van-e adva a `helpId`
2. Nézd meg a `WindowState` objektumot - tartalmazza-e a `helpId` mezőt
3. Ellenőrizd a `Window.svelte` komponenst - rendereli-e a súgó gombot

### Súgó nem nyílik meg

**Probléma**: A súgó gombra kattintva nem történik semmi.

**Megoldás**:
1. Ellenőrizd a böngésző konzolt hibákért
2. Nézd meg, hogy a `help` alkalmazás regisztrálva van-e az app registry-ben
3. Ellenőrizd a `getAppByName('help')` visszatérési értékét

### Hibás helpId paraméter

**Probléma**: A súgó alkalmazás nem találja a megfelelő tartalmat.

**Megoldás**:
1. Ellenőrizd, hogy a `helpId` helyesen van-e átadva a paraméterekben
2. Nézd meg a `getParameter<number>('helpId')` visszatérési értékét
3. Ellenőrizd, hogy a súgó tartalom létezik-e az adott ID-val

## Kapcsolódó dokumentáció

- [Ablakkezelés](/window-management) - WindowManager és WindowState
- [Alkalmazás paraméterek](/app-parameters) - AppParameters használata
- [Többnyelvűség](/i18n) - i18n rendszer integráció
- [Markdown renderelés](/markdown) - Markdown tartalom megjelenítése (tervezett)
