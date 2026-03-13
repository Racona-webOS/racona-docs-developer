---
title: Első lépések
description: Fejlesztői környezet beállítása, függőségek telepítése és az ElyOS lokális futtatása
---

## Előfeltételek

A fejlesztéshez az alábbiak szükségesek:

- **[Bun](https://bun.sh)** v1.0+ — runtime és csomagkezelő
- **[Node.js](https://nodejs.org)** v20+ — a webalkalmazáshoz szükséges
- **[Docker](https://docker.com)** és Docker Compose — PostgreSQL-hez
- **[Git](https://git-scm.com)** v2.30+

:::tip
macOS-en a Docker Desktop helyett érdemes [OrbStack](https://orbstack.dev)-et használni — lényegesen gyorsabb és kevesebb erőforrást fogyaszt.
:::

## Telepítés

### 1. Klónozás

```bash
git clone https://github.com/ElyOS-webOS/elyos-core.git
cd elyos-core
```

### 2. Függőségek

```bash
bun install
```

### 3. Környezeti változók

```bash
cp .env.example .env
```

Az ElyOS **Varlock**-ot használ a typesafe env kezeléshez. A `.env` fájlban csak a **bootstrap credentials** szükséges — minden más secret az Infisical-ból érkezik indításkor.

**Részletes dokumentáció:** [Környezeti változók →](/hu/environment)

**Infisical hozzáféréssel (ajánlott):**

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

Az Infisical hozzáférés igényléséhez fordulj a csapat rendszergazdájához. A Machine Identity credentials az Infisical dashboard-on a projekt beállításainál érhető el.

**Infisical nélkül (lokális fallback mód):**

Ha nincs Infisical hozzáférésed vagy offline dolgozol, állítsd be a `VARLOCK_FALLBACK=local` értéket, és add meg az összes szükséges változót közvetlenül a `.env`-ben:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=generalt-veletlen-titok
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
```

:::caution
Az `ORIGIN` változónak meg kell egyeznie a dev szerver URL-jével (`http://localhost:5173`). Enélkül a remote function hívások 403-as hibával meghiúsulnak a SvelteKit CSRF védelme miatt.
:::

:::tip[Scripts referencia]
Az alábbi parancsok részletes leírását a [Scripts referencia](/hu/scripts) oldalon találod, vagy görgess le a [Hasznos parancsok](#hasznos-parancsok) szekcióhoz.
:::

### 4. Adatbázis indítása

```bash
bun docker:db      # Csak PostgreSQL konténer
bun db:init        # Migrációk + seed adatok
```

**Mit csinálnak ezek a parancsok:**
- `docker:db` — elindítja a PostgreSQL konténert Docker-ben
- `db:init` — teljes adatbázis inicializálás (generálás + migrációk + seed)

**Részletek:** [Scripts referencia →](/hu/scripts)

### 5. Fejlesztői szerver

```bash
bun app:dev
```

Az alkalmazás elérhető: `http://localhost:5173`

**Mit csinál:** Elindítja a SvelteKit dev szervert lokális `.env` fájllal (Varlock nélkül).

**Részletek:** [Scripts referencia →](/hu/scripts)

:::note
Fejlesztői módban (`bun app:dev`) a Varlock nem fut — a SvelteKit dev szerver közvetlenül a `.env` fájlból olvassa a változókat. A `varlock run` csak a production build indításakor (`node server.js`) aktív.
:::

### Alapértelmezett admin fiók

Seed után az első felhasználó kap admin jogosultságot. Az e-mail cím az `ADMIN_USER_EMAIL` env változóból olvasódik.

```dotenv
# .env
ADMIN_USER_EMAIL=admin@example.com
```

| Mező   | Érték                                                     |
| ------ | --------------------------------------------------------- |
| E-mail | az `ADMIN_USER_EMAIL` értéke (vagy a seed alapértelmezés) |
| Jelszó | `Admin1234!`                                              |

:::tip
Éles telepítésnél mindig állítsd be az `ADMIN_USER_EMAIL` változót, hogy a seed ne egy generikus e-mail címmel hozza létre az admin fiókot.
:::

---

## Docker-alapú futtatás

A teljes stack (ElyOS + PostgreSQL) Docker Compose-zal is indítható:

```bash
bun docker:up
```

Ebben az esetben a Varlock a konténer indításakor fut (`varlock run -- node server.js`), és az Infisical-ból tölti be a secreteket. A `.env` fájlban csak a bootstrap credentials szükséges.

**Részletek:** [Scripts referencia → Docker](/hu/scripts#docker)

---

## Hasznos parancsok

**Teljes lista:** [Scripts referencia →](/hu/scripts)

```bash
# Fejlesztés
bun app:dev           # Dev szerver
bun app:build         # Éles build
bun app:check         # Típusellenőrzés (svelte-check + tsc)

# Adatbázis
bun db:generate       # Migrációk generálása sémaváltozásokból
bun db:migrate        # Függőben lévő migrációk futtatása
bun db:seed           # Seed adatok betöltése
bun db:reset          # Adatbázis visszaállítása
bun db:studio         # Drizzle Studio megnyitása

# Docker
bun docker:db         # Csak PostgreSQL indítása
bun docker:up         # Teljes stack (ElyOS + DB)
bun docker:down       # Leállítás
bun docker:logs       # Naplók követése

# Tesztelés (apps/web könyvtárból)
bun test              # Összes teszt egyszer
bun test:pbt          # Csak property-based tesztek

# Kódminőség (apps/web könyvtárból)
bun lint              # Prettier + ESLint ellenőrzés
bun format            # Automatikus formázás
```

## Projekt megnyitása

A monorepo gyökerét nyisd meg az IDE-ben. A fő fejlesztési terület az `apps/web/src/` mappa.

```
elyos-core/
├── apps/web/src/        ← itt dolgozol leggyakrabban
├── apps/web/.env.schema ← env változók sémája (Varlock)
├── packages/database/   ← séma és migrációk
└── .env                 ← bootstrap credentials (lokálisan)
```
