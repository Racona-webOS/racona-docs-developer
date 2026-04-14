---
title: Környezeti változók
description: Környezeti változók kezelése a Rocona projektben — Varlock, Infisical és typesafe konfiguráció
---

A Rocona projekt **Varlock**-ot használ a környezeti változók typesafe kezeléséhez. Ez biztosítja, hogy minden konfiguráció validált és típusbiztos legyen, mielőtt az alkalmazás elindul.

## Miért fontos?

A környezeti változók kezelése kritikus az alkalmazás működéséhez:

- **Adatbázis kapcsolat** — `DATABASE_URL` nélkül nem indul az alkalmazás
- **Autentikáció** — `BETTER_AUTH_SECRET` és `BETTER_AUTH_URL` szükséges
- **Email küldés** — SMTP vagy más email provider beállítások
- **Secrets management** — Infisical integráció a biztonságos secrets kezeléshez

## Három rétegű architektúra

A Rocona környezeti változó kezelése három rétegből áll:

### 1. Varlock séma (`.env.schema`)

A **típusdefiníciók és annotációk** forrása. Ebből generálódik az `env.d.ts` TypeScript típusfájl.

**Fájl:** `apps/web/.env.schema`

**Részletek:** [Varlock séma formátum →](/hu/environment-schema)

### 2. Runtime validáció (`schema.ts`)

A **futásidejű validációs logika** TypeScript-ben. Ez ellenőrzi az Infisical-ból vagy `.env` fájlból betöltött értékeket.

**Fájl:** `apps/web/src/lib/secrets/schema.ts`

**Részletek:** [Runtime validáció →](/hu/environment-runtime)

### 3. Központi env modul (`env.ts`)

A **típusbiztos hozzáférési pont** az alkalmazáskódból.

**Fájl:** `apps/web/src/lib/env.ts`

**Használat:**
```typescript
import { env } from '$lib/env';

const port = env.ELYOS_PORT;        // number
const devMode = env.DEV_MODE;       // boolean
const dbUrl = env.DATABASE_URL;     // string
```

## Indítási módok

### Fejlesztés (lokális .env)

```bash
bun app:dev
```

A `.env.local` fájlból tölti be a változókat. Gyors és egyszerű lokális fejlesztéshez.

### Fejlesztés (Varlock + Infisical)

```bash
bun app:dev:varlock
```

Az Infisical-ból tölti be a változókat. Teszteléshez, ha az éles környezethez hasonló konfigurációt szeretnél.

### Produkció (Docker)

```dockerfile
CMD ["varlock", "run", "--", "bun", "run", "apps/web/server.js"]
```

Csak a bootstrap credentials vannak a `.env` fájlban, minden más az Infisical-ból jön.

**Részletek:** [Indítási módok és Infisical →](/hu/environment-infisical)

## Új változó hozzáadása

Ha új környezeti változót adsz hozzá, **3 helyen kell frissítened**:

1. **`.env.schema`** — Varlock annotációkkal
2. **`schema.ts`** — 4 helyen (EXPECTED_KEYS, REQUIRED_KEYS, validateSchema, validEnvArbitrary)
3. **`.env.example`** — példa érték

**Részletes útmutató:** [Új változó hozzáadása →](/hu/environment-add-variable)

## Fájlstruktúra

```
elyos-core/
├── .env.example                          # Példa konfiguráció
├── .env.local                            # Lokális fejlesztői változók (gitignore)
├── apps/web/
│   ├── .env.schema                       # Varlock séma (@generateTypes)
│   ├── src/
│   │   ├── env.d.ts                      # Generált TypeScript típusok
│   │   ├── lib/
│   │   │   ├── env.ts                    # Központi env export
│   │   │   └── secrets/
│   │   │       ├── varlock.ts            # Infisical integráció
│   │   │       └── schema.ts             # Runtime validáció
│   │   └── server.js                     # Express + Socket.IO szerver
│   └── vite.config.ts                    # envDir: '../..'
```

## Előnyök

- **Típusbiztonság** — teljes TypeScript támogatás
- **Validáció** — séma alapú validáció indításkor és runtime-ban
- **Secrets management** — központi Infisical integráció
- **Fallback** — lokális fejlesztés támogatása
- **Coercion** — automatikus típuskonverzió (string → boolean/number)
- **Token renewal** — automatikus token megújítás
- **Retry logic** — hibatűrő kapcsolódás (3 újrapróbálkozás)

## Következő lépések

- [Varlock séma formátum →](/hu/environment-schema) — annotációk, típusok, függvények
- [Infisical integráció →](/hu/environment-infisical) — bootstrap credentials, működés
- [Runtime validáció →](/hu/environment-runtime) — schema.ts részletesen
- [Új változó hozzáadása →](/hu/environment-add-variable) — lépésről lépésre útmutató
