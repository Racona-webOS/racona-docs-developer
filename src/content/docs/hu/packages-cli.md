---
title: "@racona/cli"
description: A Rocona CLI eszköz, amellyel új alkalmazás projektet hozhatsz létre egyetlen paranccsal
next:
  link: /hu/plugins/
  label: Alkalmazás fejlesztés
---

A `@racona/cli` egy interaktív parancssori eszköz, amellyel másodpercek alatt létrehozhatsz egy teljesen felkonfigurált Racona alkalmazás projektet. Nem kell kézzel beállítani a Vite konfigurációt, a TypeScript-et, a Mock SDK-t vagy a build scripteket — a CLI mindent előkészít.

```bash
bunx @racona/cli
```

A wizard végigvezet az alapbeállításokon (alkalmazás ID, név, szerző), majd kiválaszthatod a kívánt **funkciókat**. A projekt a kiválasztott funkciók kombinációjából generálódik — nincsenek fix template-ek.

## Funkció választó

Az alkalmazás metaadatainak megadása után a CLI megkérdezi, mely funkciókat szeretnéd bekapcsolni:

| Funkció | Mit ad hozzá |
|---|---|
| `sidebar` | Oldalsáv navigáció (`menu.json`, `AppLayout` mód, több oldal komponens) |
| `database` | SQL migrációk (`migrations/001_init.sql`), `sdk.data.query()` támogatás |
| `remote_functions` | Szerver oldali függvények (`server/functions.ts`), `sdk.remote.call()` támogatás |
| `notifications` | `sdk.notifications.send()` támogatás, `notifications` jogosultság |
| `i18n` | Fordítási fájlok (`locales/hu.json`, `locales/en.json`), `sdk.i18n.t()` támogatás |
| `datatable` | DataTable komponens insert formmal, sor akciókkal (duplikálás/törlés), teljes i18n |

:::note
A `database` megköveteli a `remote_functions` funkciót — ha `database`-t választasz, a `remote_functions` automatikusan bekapcsol.
:::

## Generált projekt

A generált struktúra a kiválasztott funkcióktól függ. Minden funkcióval engedélyezve:

```
my-app/
├── manifest.json          # Alkalmazás metaadatok és jogosultságok
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (ha sidebar)
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── plugin.ts
│   └── components/        # (ha sidebar)
│       ├── Overview.svelte
│       ├── Settings.svelte
│       ├── Datatable.svelte     # (ha datatable)
│       ├── Notifications.svelte # (ha notifications)
│       └── Remote.svelte        # (ha remote_functions)
├── server/                # (ha remote_functions)
│   └── functions.ts
├── migrations/            # (ha database)
│   ├── 001_init.sql
│   └── dev/
│       └── 000_auth_seed.sql
├── locales/               # (ha i18n)
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

## Datatable funkció

Ha a `datatable` + `database` + `remote_functions` mind be van kapcsolva, a generált `Datatable.svelte` tartalmazza:

- Adattáblát `sdk.data.query()` hívással töltve
- **Beszúró űrlapot** a táblázat alatt (`name` + `value` mezők)
- **Sor akciókat**: Duplikálás (elsődleges) és Törlés (másodlagos, destructive) — törlés `sdk.ui.dialog()` megerősítő modallal
- Teljes i18n támogatást `t()` hívásokkal

A generált `server/functions.ts` exportálja az `example`, `insertItem`, `deleteItem` és `duplicateItem` függvényeket — mindegyik az alkalmazás saját `app__<id>` adatbázis sémájára van korlátozva.

## Kapcsolódó

- [Első alkalmazás létrehozása](/hu/plugins-getting-started/) — részletes útmutató a CLI használatához és a generált projekt struktúrához
