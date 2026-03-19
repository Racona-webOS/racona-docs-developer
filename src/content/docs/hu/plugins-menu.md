---
title: menu.json és AppLayout mód
description: Többoldalas alkalmazás készítése menu.json-nal, AppLayout mód és komponens build
---

## Mi az AppLayout mód?

Ha az alkalmazás gyökerében van egy `menu.json` fájl, az ElyOS AppLayout módban tölti be az alkalmazást. Ilyenkor az alkalmazás egy oldalsávos navigációval rendelkező, többoldalas alkalmazásként jelenik meg — ugyanolyan elrendezésben, mint a beépített alkalmazások (pl. Beállítások, Felhasználók).

AppLayout mód nélkül (standalone) az alkalmazás egyetlen Web Component-ként töltődik be, teljes ablakot kitöltve.

---

## menu.json struktúra

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

### Mezők

| Mező | Típus | Leírás |
|---|---|---|
| `labelKey` | `string` | i18n kulcs a menüpont feliratához (az alkalmazás `locales/` fájljaiból) |
| `href` | `string` | Hash-alapú útvonal (pl. `#overview`) |
| `icon` | `string` | Lucide ikon neve (PascalCase, pl. `Home`, `Settings`, `Table`) |
| `component` | `string` | A betöltendő Svelte komponens neve (fájlnév kiterjesztés nélkül) |

### Ikon nevek

Az `icon` mező értéke bármely [Lucide](https://lucide.dev/icons/) ikon neve lehet PascalCase formátumban:

```json
"icon": "Home"        // home ikon
"icon": "Settings"    // fogaskerék
"icon": "Table"       // táblázat
"icon": "Puzzle"      // puzzle darab
"icon": "Users"       // felhasználók
"icon": "BarChart"    // oszlopdiagram
```

---

## Komponensek elhelyezése

AppLayout módban minden menüponthoz egy külön Svelte komponens tartozik. Ezeket a `src/components/` mappában kell elhelyezni:

```
my-app/
├── manifest.json
├── menu.json
├── src/
│   ├── App.svelte          # Fő belépési pont (opcionális AppLayout módban)
│   └── components/
│       ├── Overview.svelte
│       ├── Settings.svelte
│       └── DataTableDemo.svelte
├── locales/
│   ├── hu.json
│   └── en.json
└── build-all.js
```

A `menu.json`-ban a `component` mező értékének meg kell egyeznie a fájlnévvel (kiterjesztés nélkül):

```json
{ "component": "Overview" }   →   src/components/Overview.svelte
{ "component": "Settings" }   →   src/components/Settings.svelte
```

---

## Build AppLayout módban

Mivel minden komponenst külön kell buildelni, a `build-all.js` script automatizálja ezt:

```bash
bun run build:all
```

A script:
1. Lebuildi a fő alkalmazást (`BUILD_MODE=main`)
2. Végigmegy a `src/components/` mappán
3. Minden `.svelte` fájlt külön entry point-ként buildelel

```js
// build-all.js
// 1. Fő alkalmazás build
execSync('BUILD_MODE=main vite build', { stdio: 'inherit' });

// 2. Komponensek buildelése
for (const file of svelteFiles) {
  execSync(`BUILD_MODE=components COMPONENT_FILE=${file} vite build`, {
    stdio: 'inherit'
  });
}
```

A build eredménye:

```
dist/
├── index.js              # Fő belépési pont
├── Overview.js           # Overview komponens
├── Settings.js           # Settings komponens
├── DataTableDemo.js      # DataTableDemo komponens
└── assets/
```

---

## Fordítások menüpontokhoz

A `labelKey` értékei az alkalmazás `locales/` fájljaiból töltődnek be. Például:

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

## Teljes példa

Az `sdk-demo` alkalmazás egy jó referencia AppLayout módra. Négy menüpontja van:

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

Forrás: `elyos-core/examples/apps/sdk-demo/`

---

## Mikor használj AppLayout módot?

| Standalone (nincs menu.json) | AppLayout (van menu.json) |
|---|---|
| Egyszerű, egyoldalas widget | Több nézetet tartalmazó alkalmazás |
| Dashboard elem | Beállítások, admin felület |
| Kis segédeszköz | Komplex adatkezelő app |

Ha az alkalmazásod több logikailag elkülönülő részt tartalmaz, az AppLayout mód jobb felhasználói élményt nyújt, és konzisztens megjelenést biztosít a többi beépített alkalmazással.
