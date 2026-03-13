---
title: Architektúra áttekintés
description: Az ElyOS monorepo felépítése, a SvelteKit alkalmazás struktúrája és a főbb rétegek
next:
  link: /hu/environment/
  label: Környezeti változók
---

## Monorepo struktúra

Az ElyOS Bun workspaces alapú monorepo:

```
elyos-core/
├── apps/
│   └── web/                  # Fő SvelteKit alkalmazás (@elyos/core)
├── packages/
│   ├── database/             # Drizzle ORM sémák, migrációk, seed (@elyos/database)
│   ├── sdk/                  # Plugin SDK (@elyos/sdk)
│   └── create-elyos-plugin/  # CLI eszköz plugin generáláshoz
├── examples/
│   └── plugins/              # Példa plugin implementációk
├── docker/                   # Dockerfile és docker-compose.yml
├── docs/                     # Projekt dokumentáció
└── package.json              # Root workspace konfiguráció
```

## A webalkalmazás rétegei

```
apps/web/src/
├── routes/          # SvelteKit fájlalapú routing
├── apps/            # Beépített asztali alkalmazások
├── lib/
│   ├── components/  # UI komponensek
│   ├── stores/      # Globális állapotkezelés (Svelte 5 runes)
│   ├── server/      # Csak szerver oldali kód
│   ├── i18n/        # Többnyelvűség
│   ├── auth/        # Autentikáció (better-auth kliens)
│   ├── services/    # Kliens oldali szolgáltatások
│   ├── types/       # TypeScript típusok
│   └── utils/       # Segédfüggvények
├── hooks.server.ts  # Szerver hook-ok (auth, i18n, session)
├── hooks.client.ts  # Kliens hook-ok
└── app.d.ts         # SvelteKit ambient típusok
```

## Routing struktúra

```
routes/
├── (public)/          # Opcionális publikus weboldal (marketing, ismertető)
├── admin/
│   ├── (auth)/        # Hitelesítési oldalak (login, 2FA, stb.)
│   └── (protected)/   # Védett asztali felület (maga a WebOS rendszer)
└── api/               # REST API végpontok
    ├── apps/          # Alkalmazás metaadatok
    ├── files/         # Fájlkezelés
    ├── notifications/ # Értesítések kezelése
    ├── plugins/       # Plugin betöltés és kezelés
    └── health/        # Adatbázis elérhetőség ellenőrzése
```

A fő WebOS asztali felület az `admin/(protected)/` alatt él. A `(public)/` route csoport egy opcionális publikus weboldal (pl. marketing oldal, termékismertető) számára van fenntartva.

A viselkedést a `PUBLIC_SITE_ENABLED` env változó szabályozza:

| Érték | Viselkedés |
|-------|-----------|
| `true` | A `/` útvonal befut a `(public)/` csoportba — megjelenik a publikus oldal |
| `false` | A `/` útvonal azonnal átirányít az `/admin`-ra — nincs publikus oldal |

Ez lehetővé teszi, hogy ugyanaz a telepítés akár önálló WebOS rendszerként, akár egy publikus weboldallal kiegészítve működjön.

## Beépített alkalmazások

Az `src/apps/` mappa tartalmazza az összes beépített asztali alkalmazást. Minden alkalmazás önálló könyvtár:

```
apps/
├── chat/            # Valós idejű belső üzenetküldés
├── help/            # Beépített dokumentációböngésző
├── log/             # Rendszer- és hibanapló megjelenítő
├── notifications/   # Értesítések kezelése
├── plugin-manager/  # Plugin feltöltés és telepítés (admin)
├── settings/        # Megjelenés, biztonság, nyelv
└── users/           # Felhasználó-, csoport-, szerepkörkezelés (admin)
```

Minden alkalmazás kötelező fájljai:

| Fájl             | Leírás                                              |
| ---------------- | --------------------------------------------------- |
| `index.svelte`   | Belépési pont — a WindowManager tölti be lazily     |
| `icon.svg`       | SVG ikon fájl — akkor szükséges, ha a metaadatok `icon` mezőjében fájlnév szerepel; Lucide ikonnév esetén (PascalCase, pont nélkül) nem kell fájl |
| `*.remote.ts`    | Szerver akciók (`command`/`query`)                  |
| `menu.json`      | Opcionális oldalsáv menü definíció                  |
| `stores/`        | Alkalmazás-specifikus Svelte 5 rune store-ok        |
| `components/`    | Alkalmazás-specifikus Svelte komponensek            |

## Szerver architektúra

Az ElyOS két szerver réteget használ:

**SvelteKit szerver** — a fő alkalmazáslogika, server actions, API route-ok, autentikáció.

**Express + Socket.IO** (`server.js`) — valós idejű kommunikáció a chat funkcióhoz. A Socket.IO szerver a `global.io` változón keresztül érhető el a SvelteKit hook-okból.

```
Kliens
  │
  ├── HTTP/HTTPS ──→ SvelteKit (routes, server actions, API)
  │
  └── WebSocket ──→ Express + Socket.IO (chat, valós idejű)
```

## Adatbázis réteg

```
packages/database/src/
├── schemas/
│   ├── auth/        # better-auth táblák (users, sessions, stb.)
│   └── platform/    # Platform táblák (apps, chat, i18n, plugins, stb.)
├── seeds/           # Seed szkriptek
├── types/           # Exportált DB típusok
└── index.ts         # Fő export (db kliens, sémák, típusok)
```

A `@elyos/database` csomag importálható az alkalmazásból:

```typescript
import { db, schema } from '@elyos/database';
```

## Útvonal aliasok

| Alias          | Feloldás                          |
| -------------- | --------------------------------- |
| `$lib`         | `apps/web/src/lib`                |
| `$app/server`  | SvelteKit szerver modul           |
| `@elyos/database` | `packages/database/src`        |

## Technológiai stack

| Réteg          | Technológia                                         |
| -------------- | --------------------------------------------------- |
| Frontend       | SvelteKit 2, Svelte 5 (runes), TypeScript 5         |
| Stílus         | Tailwind CSS 4 (Vite plugin, nincs config fájl)     |
| UI primitívek  | shadcn-svelte (bits-ui alapon), lucide-svelte            |
| Backend        | SvelteKit server + Express + Socket.IO              |
| Adatbázis      | PostgreSQL + Drizzle ORM                            |
| Autentikáció   | better-auth                                         |
| Validáció      | Valibot (adat), Varlock (env)                       |
| Env kezelés    | Varlock + Infisical                                 |
| Runtime        | Bun                                                 |
| Infrastruktúra | Docker + Docker Compose                             |
| Tesztelés      | Vitest, fast-check, Playwright                      |

**Részletek:**
- [Környezeti változók →](/hu/environment) — Varlock és Infisical integráció
