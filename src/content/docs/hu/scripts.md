---
title: Scripts referencia
description: Összes elérhető npm/bun script a fejlesztéshez, build-hez, teszteléshez és Docker kezeléshez
---

A Rocona egy **Bun workspaces** alapú monorepo. A root `package.json` tartalmazza a fő parancsokat, amelyek a workspace csomagok scriptjeit hívják meg.

## Monorepo struktúra

```
elyos-core/
├── package.json              # Root scripts (bun --filter használattal)
├── apps/
│   └── web/
│       └── package.json      # @elyos/core scripts
└── packages/
    └── database/
        └── package.json      # @elyos/database scripts
```

**Fontos:** A root scripteket **bárhonnan** futtathatod a monorepo-ban. Az `apps/web` specifikus scriptjeit csak az `apps/web` könyvtárból.

---

## Fejlesztés

### `bun app:dev`

**Lokáció:** Root
**Futtatja:** `apps/web` → `dev` script

Elindítja a SvelteKit dev szervert **lokális .env fájllal** (Varlock nélkül).

```bash
bun app:dev
```

**Mit csinál:**
- Betölti a `../../.env` fájlt (root `.env`)
- Elindítja a Vite dev szervert (`http://localhost:5173`)
- Hot module replacement (HMR) engedélyezve

**Mikor használd:** Lokális fejlesztéshez, gyors iterációhoz.

---

### `bun app:dev:varlock`

**Lokáció:** Root
**Futtatja:** `apps/web` → `dev:varlock` script

Elindítja a SvelteKit dev szervert **Varlock-kal** (Infisical secrets).

```bash
bun app:dev:varlock
```

**Mit csinál:**
- Varlock betölti a secreteket az Infisical-ból
- Validálja az env változókat
- Elindítja a Vite dev szervert

**Mikor használd:** Ha az éles környezethez hasonló konfigurációt szeretnél tesztelni.

---

## Build és preview

### `bun app:build`

**Lokáció:** Root
**Futtatja:** `apps/web` → `build` script

Production build készítése.

```bash
bun app:build
```

**Mit csinál:**
- SvelteKit production build (`vite build`)
- Adapter-node kimenet: `apps/web/build/`
- Statikus asszetek: `apps/web/build/client/`

---

### `bun app:preview`

**Lokáció:** `apps/web`
**Futtatja:** `preview` script

Elindítja a production build-et lokálisan.

```bash
cd apps/web
bun preview
```

**Mit csinál:**
- Elindítja az Express + Socket.IO szervert (`server.js`)
- Kiszolgálja a build-elt alkalmazást
- Port: `process.env.PORT` vagy `3000`

**Előfeltétel:** Előbb futtasd a `bun app:build` parancsot.

---

## Típusellenőrzés

### `bun app:check`

**Lokáció:** Root
**Futtatja:** `apps/web` → `check` script

TypeScript és Svelte típusellenőrzés.

```bash
bun app:check
```

**Mit csinál:**
- `svelte-kit sync` — generálja a SvelteKit típusokat
- `svelte-check` — ellenőrzi a Svelte komponenseket
- `tsc` — TypeScript típusellenőrzés

**Mikor használd:** Commit előtt, CI/CD-ben.

---

### `bun check:watch`

**Lokáció:** `apps/web`

Folyamatos típusellenőrzés watch módban.

```bash
cd apps/web
bun check:watch
```

---

## Adatbázis

### `bun db:init`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:init` script

**Első indítás** — teljes adatbázis inicializálás.

```bash
bun db:init
```

**Mit csinál:**
1. `db:generate` — migrációk generálása
2. `db:migrate` — migrációk futtatása
3. `db:seed` — seed adatok betöltése

**Mikor használd:** Első telepítéskor vagy teljes reset után.

---

### `bun db:generate`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:generate` script

Drizzle migrációk generálása a séma változásokból.

```bash
bun db:generate
```

**Mit csinál:**
- Összehasonlítja a `src/schemas/` fájlokat az adatbázissal
- Generál SQL migrációs fájlokat a `drizzle/` mappába

**Mikor használd:** Séma módosítás után (új tábla, oszlop, index, stb.).

---

### `bun db:migrate`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:migrate` script

Függőben lévő migrációk futtatása.

```bash
bun db:migrate
```

**Mit csinál:**
- Futtatja az összes új migrációt a `drizzle/` mappából
- Frissíti a `__drizzle_migrations` táblát

---

### `bun db:seed`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:seed` script

Seed adatok betöltése.

```bash
bun db:seed
```

**Mit csinál:**
- Futtatja a `src/seeds/` mappában lévő seed scripteket
- Létrehozza az admin felhasználót (`ADMIN_USER_EMAIL` alapján)
- Betölti az alapértelmezett alkalmazásokat, szerepköröket, stb.

---

### `bun db:studio`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:studio` script

Drizzle Studio megnyitása.

```bash
bun db:studio
```

**Mit csinál:**
- Elindítja a Drizzle Studio web felületet
- Böngészőben megnyitja: `https://local.drizzle.studio`
- Vizuális adatbázis böngésző és szerkesztő

---

### `bun db:reset`

**Lokáció:** Root
**Futtatja:** `packages/database` → `db:reset` script

Adatbázis teljes visszaállítása.

```bash
bun db:reset
```

**Mit csinál:**
1. Eldobja az összes táblát
2. Újra futtatja a migrációkat
3. Betölti a seed adatokat

**Figyelem:** Minden adat elvész!

---

## Docker

### `bun docker:db`

**Lokáció:** Root

Csak a PostgreSQL konténer indítása.

```bash
bun docker:db
```

**Mit csinál:**
- Elindítja a `postgres` szolgáltatást
- Port: `5432`
- Adatok: `docker/postgres-data/` (perzisztens)

**Mikor használd:** Lokális fejlesztéshez, ha csak az adatbázisra van szükséged.

---

### `bun docker:up`

**Lokáció:** Root

Teljes stack indítása (Racona + PostgreSQL).

```bash
bun docker:up
```

**Mit csinál:**
- Build-eli a Docker image-et
- Elindítja az `app` és `postgres` szolgáltatásokat
- Detached módban (`-d`)

**Elérhető:** `http://localhost:3000`

---

### `bun docker:rebuild`

**Lokáció:** Root

Teljes újraépítés cache nélkül.

```bash
bun docker:rebuild
```

**Mit csinál:**
- `--no-cache` build
- Újraindítja a konténereket

**Mikor használd:** Ha a cache-elt rétegek problémát okoznak.

---

### `bun docker:down`

**Lokáció:** Root

Összes konténer leállítása.

```bash
bun docker:down
```

**Mit csinál:**
- Leállítja és eltávolítja a konténereket
- A volume-ok megmaradnak (adatok nem vesznek el)

---

### `bun docker:logs`

**Lokáció:** Root

Konténer naplók követése.

```bash
bun docker:logs
```

**Mit csinál:**
- Valós időben követi a konténerek naplóit
- `Ctrl+C` a kilépéshez

---

### `bun docker:build`

**Lokáció:** Root

Docker image build (multi-platform).

```bash
bun docker:build
```

**Tag:** `racona/core:latest`

---

### `bun docker:build:amd64`

**Lokáció:** Root

AMD64 (x86_64) platform specifikus build.

```bash
bun docker:build:amd64
```

**Tag:** `racona/core:latest-amd64`, `racona/core:0.1.0-amd64`

---

### `bun docker:build:arm64`

**Lokáció:** Root

ARM64 (Apple Silicon, ARM szerverek) platform specifikus build.

```bash
bun docker:build:arm64
```

**Tag:** `racona/core:latest-arm64`, `racona/core:0.1.0-arm64`

---

### `bun docker:save:amd64` / `bun docker:save:arm64`

**Lokáció:** Root

Docker image mentése `.tar` fájlba.

```bash
bun docker:save:amd64
```

**Kimenet:** `docker/elyos-core.tar`

**Mikor használd:** Offline telepítéshez, image megosztáshoz.

---

## Tesztelés

### `bun test`

**Lokáció:** `apps/web`

Összes teszt futtatása egyszer.

```bash
cd apps/web
bun test
```

**Mit csinál:**
- Vitest unit tesztek
- `--run` mód (nem watch)

---

### `bun test:watch`

**Lokáció:** `apps/web`

Tesztek watch módban.

```bash
cd apps/web
bun test:watch
```

**Mit csinál:**
- Újrafuttatja a teszteket fájl változáskor
- Interaktív mód

---

### `bun test:pbt`

**Lokáció:** `apps/web`

Csak property-based tesztek futtatása.

```bash
cd apps/web
bun test:pbt
```

**Mit csinál:**
- Csak a `Property` szót tartalmazó teszteket futtatja
- fast-check alapú tesztek

---

## Kódminőség

### `bun lint`

**Lokáció:** `apps/web`

Prettier és ESLint ellenőrzés.

```bash
cd apps/web
bun lint
```

**Mit csinál:**
- `prettier --check .` — formázás ellenőrzés
- `eslint .` — kód minőség ellenőrzés

---

### `bun format`

**Lokáció:** `apps/web`

Automatikus kód formázás.

```bash
cd apps/web
bun format
```

**Mit csinál:**
- `prettier --write .` — formázza az összes fájlt

---

## Egyéb

### `bun package:update`

**Lokáció:** `apps/web`

Interaktív csomag frissítés.

```bash
cd apps/web
bun package:update
```

**Mit csinál:**
- `bun update -i` — interaktív frissítő
- Kiválaszthatod, melyik csomagokat frissíted

---

## Gyakori workflow-k

### Első indítás

```bash
# 1. Függőségek
bun install

# 2. Env fájl
cp .env.example .env
# Szerkeszd a .env fájlt

# 3. Adatbázis
bun docker:db
bun db:init

# 4. Dev szerver
bun app:dev
```

### Séma módosítás

```bash
# 1. Módosítsd a packages/database/src/schemas/ fájlokat

# 2. Generálj migrációt
bun db:generate

# 3. Futtasd a migrációt
bun db:migrate

# 4. (Opcionális) Seed újrafuttatása
bun db:seed
```

### Production build tesztelése

```bash
# 1. Build
bun app:build

# 2. Preview
cd apps/web
bun preview
```

### Docker telepítés

```bash
# 1. Env fájl (csak bootstrap credentials)
cp .env.example .env
# INFISICAL_CLIENT_ID és INFISICAL_CLIENT_SECRET

# 2. Indítás
bun docker:up

# 3. Naplók
bun docker:logs
```

---

## Következő lépések

- [Környezeti változók →](/hu/environment) — Varlock és Infisical
- [Adatbázis →](/hu/database) — Drizzle ORM és migrációk
- [Tesztelés →](/hu/testing) — Unit és property-based tesztek
