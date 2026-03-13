---
title: Docker
description: Docker használata az ElyOS fejlesztésében és üzemeltetésében
---

Az ElyOS teljes mértékben támogatja a Docker-alapú fejlesztést és üzemeltetést. Ez a dokumentum részletesen bemutatja, hogyan használható a Docker az ElyOS-szel.

## Miért Docker?

A Docker használata számos előnnyel jár:

- **Konzisztens környezet** — minden fejlesztő és szerver ugyanazt a környezetet használja
- **Egyszerű telepítés** — nincs szükség Node.js, Bun vagy PostgreSQL helyi telepítésére
- **Izolált szolgáltatások** — az adatbázis és az alkalmazás külön konténerekben fut
- **Gyors indítás** — egyetlen paranccsal elindítható a teljes rendszer
- **Reprodukálható build** — a Docker image mindig ugyanúgy épül fel

## Előfeltételek

### Docker telepítése

Telepítsd a Docker-t a rendszeredre:

- **macOS:** [OrbStack](https://orbstack.dev) (ajánlott) vagy [Docker Desktop](https://docker.com)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/)
- **Windows:** [Docker Desktop](https://docker.com)

:::tip[OrbStack macOS-re]
macOS felhasználóknak erősen ajánlott az **OrbStack** használata Docker Desktop helyett:

- Lényegesen gyorsabb konténer- és VM-indítás
- Töredék annyi memória és CPU használat
- Natív macOS Keychain integráció
- Sokkal kisebb alkalmazás méret
- Ingyenes személyes használatra

[Telepítsd az OrbStack-et →](https://orbstack.dev)
:::

### Bun telepítése (opcionális)

A Bun telepítése nem kötelező, de megkönnyíti a Docker parancsok futtatását:

```bash
curl -fsSL https://bun.sh/install | bash
```

Bun nélkül is használható a Docker, csak a nyers `docker compose` parancsokat kell futtatni.

## Gyors indítás Docker-rel

### 1. Repository klónozása

```bash
git clone https://github.com/ElyOS-webOS/elyos-core
cd elyos-core
```

### 2. Környezeti változók konfigurálása

Másold le a példafájlt és töltsd ki az értékeket:

```bash
cp .env.example .env
```

**Varlock + Infisical használatával (ajánlott):**

```bash
# .env
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

**Infisical nélkül (lokális fallback mód):**

```bash
# .env
VARLOCK_FALLBACK=local
# ... töltsd ki az összes változót a .env.example alapján
```

:::note[Környezeti változók]
A környezeti változók részletes leírásáért lásd a [Környezeti változók](/environment) dokumentációt.
:::

### 3. Rendszer indítása

**Bun segítségével:**

```bash
bun docker:up
```

**Bun nélkül:**

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Alkalmazás megnyitása

Nyisd meg a böngészőben: [http://localhost:3000](http://localhost:3000)

## Docker Compose szolgáltatások

A `docker/docker-compose.yml` fájl három szolgáltatást definiál, amelyek sorban indulnak:

### 1. postgres

PostgreSQL 18 adatbázis egyedi image-dzsel, amely tartalmazza a `postgres-json-schema` extensiont.

```yaml
postgres:
  build:
    context: postgres
    dockerfile: Dockerfile
  ports:
    - '${POSTGRES_PORT:-5432}:5432'
  volumes:
    - elyos-data:/var/lib/postgresql
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-elyos} -d ${POSTGRES_DB:-elyos}']
    interval: 10s
    timeout: 5s
    retries: 5
```

**Jellemzők:**

- Port: `5432` (konfigurálható: `POSTGRES_PORT`)
- Perzisztens adattárolás: `elyos-data` volume
- Health check: 10 másodpercenként ellenőrzi az adatbázis elérhetőségét
- Automatikus újraindítás: `unless-stopped`

### 2. db-init

Egyszeri inicializálás: Drizzle migrációk futtatása és seed adatok betöltése.

```yaml
db-init:
  command: >
    sh -c 'bun --filter @elyos/database db:init ${RESET:+-- --reset}'
  depends_on:
    postgres:
      condition: service_healthy
  restart: 'no'
```

**Jellemzők:**

- Csak akkor indul, ha a `postgres` szolgáltatás egészséges
- Futtatja a `bun db:init` parancsot
- Egyszeri futás: `restart: no`
- Támogatja a `RESET=1` környezeti változót az adatbázis teljes visszaállításához

### 3. elyos

Az ElyOS webalkalmazás (SvelteKit + Express + Socket.IO).

```yaml
elyos:
  ports:
    - '${ELYOS_PORT:-3000}:3000'
  depends_on:
    db-init:
      condition: service_completed_successfully
  volumes:
    - ../apps/web/uploads:/app/uploads
  restart: unless-stopped
```

**Jellemzők:**

- Port: `3000` (konfigurálható: `ELYOS_PORT`)
- Csak akkor indul, ha a `db-init` sikeresen lefutott
- Perzisztens fájltárolás: `uploads` mappa
- Automatikus újraindítás: `unless-stopped`
- Health check: 30 másodpercenként ellenőrzi az `/api/health` végpontot

## Indítási sorrend

A szolgáltatások sorban indulnak, biztosítva a megfelelő függőségeket:

```
1. postgres (indul)
   ↓
2. postgres (healthy)
   ↓
3. db-init (indul és lefut)
   ↓
4. db-init (completed successfully)
   ↓
5. elyos (indul)
```

## Adatbázis inicializálás és reset

### Normál inicializálás

A `db-init` konténer **idempotens** — biztonságosan futtatható többször is, nem duplikál adatokat (upsert logika).

```bash
bun docker:up
```

### Teljes adatbázis reset

Ha teljes adatbázis-visszaállításra van szükség (minden adat törlése és újraseedelés):

```bash
RESET=1 bun docker:up
```

Ez ugyanazt a `db-init` konténert futtatja, de truncate-eli az összes táblát a seed előtt.

**Bun nélkül:**

```bash
RESET=1 docker compose -f docker/docker-compose.yml up -d
```

## Fejlesztés Docker-rel

### Hot reload támogatás

A Docker-alapú fejlesztés támogatja a hot reload-ot volume mount segítségével. Ehhez módosítsd a `docker-compose.yml` fájlt:

```yaml
elyos:
  volumes:
    - ../apps/web:/app/apps/web
    - ../packages:/app/packages
  command: bun run app:dev
```

:::caution[Teljesítmény]
A volume mount lassabb lehet macOS-en és Windows-en. Éles fejlesztéshez ajánlott a [lokális fejlesztési mód](/getting-started#lokális-fejlesztés).
:::

### Csak adatbázis indítása

Ha csak az adatbázist szeretnéd Docker-ben futtatni, és az alkalmazást lokálisan:

```bash
bun docker:db
```

Ez csak a `postgres` szolgáltatást indítja el.

**Bun nélkül:**

```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

## Docker parancsok

### Alapvető parancsok

```bash
# Konténerek indítása (háttérben)
bun docker:up
# vagy
docker compose -f docker/docker-compose.yml up -d

# Konténerek leállítása
bun docker:down
# vagy
docker compose -f docker/docker-compose.yml down

# Konténer naplók követése
bun docker:logs
# vagy
docker compose -f docker/docker-compose.yml logs -f

# Csak PostgreSQL indítása
bun docker:db
# vagy
docker compose -f docker/docker-compose.yml up -d postgres
```

### Konténer állapot ellenőrzése

```bash
# Futó konténerek listázása
docker ps

# Összes konténer listázása (leállítottak is)
docker ps -a

# Konténer naplók megtekintése
docker logs elyos-app
docker logs elyos-postgres
docker logs elyos-db-init
```

### Konténerbe belépés

```bash
# ElyOS konténerbe belépés
docker exec -it elyos-app sh

# PostgreSQL konténerbe belépés
docker exec -it elyos-postgres psql -U elyos -d elyos
```

### Adatok törlése

```bash
# Konténerek és hálózat törlése
docker compose -f docker/docker-compose.yml down

# Konténerek, hálózat és volume-ok törlése (adatbázis adatok is)
docker compose -f docker/docker-compose.yml down -v

# Image-ek törlése
docker rmi elyos-elyos elyos-postgres
```

## Multi-stage build

A `docker/Dockerfile` egy optimalizált multi-stage build-et használ három fázissal:

### 1. deps — Függőségek telepítése

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
# ... workspace package.json fájlok
RUN bun install --frozen-lockfile
```

**Jellemzők:**

- Csak a `package.json` és `bun.lock` fájlokat másolja
- Cache-elhető réteg — ha a függőségek nem változnak, ez a réteg cache-ből jön
- Frozen lockfile — reprodukálható build

### 2. builder — Alkalmazás build

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY packages/database ./packages/database
# ... forráskód másolása
ENV NODE_ENV=production
RUN bun run app:build
```

**Jellemzők:**

- Függőségek másolása a `deps` fázisból
- Forráskód másolása
- SvelteKit build futtatása (`adapter-node` kimenet)

### 3. runner — Production image

```dockerfile
FROM oven/bun:1-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S elyos -u 1001 -G nodejs
COPY --from=builder --chown=elyos:nodejs /app/apps/web/build ./apps/web/build
RUN bun install --production --frozen-lockfile
RUN bun add -g varlock
USER elyos
CMD ["varlock", "run", "--", "bun", "run", "apps/web/server.js"]
```

**Jellemzők:**

- Alpine Linux alapú image — minimális méret
- Nem-root felhasználó — biztonság
- Csak production függőségek
- Varlock globális telepítése — secrets management
- Health check — `/api/health` végpont ellenőrzése

## Image build

### Helyi build

```bash
docker build -f docker/Dockerfile -t elyos/core:latest .
```

### Build argumentumok

```bash
docker build \
  -f docker/Dockerfile \
  -t elyos/core:latest \
  --build-arg NODE_ENV=production \
  .
```

### Multi-platform build

```bash
docker buildx build \
  -f docker/Dockerfile \
  -t elyos/core:latest \
  --platform linux/amd64,linux/arm64 \
  .
```

## Környezeti változók

A Docker Compose automatikusan betölti a gyökér `.env` fájlt. Az alábbi változók konfigurálhatók:

| Változó                     | Alapértelmezett | Leírás                                    |
| --------------------------- | --------------- | ----------------------------------------- |
| `ELYOS_PORT`                | `3000`          | ElyOS alkalmazás portja                   |
| `POSTGRES_PORT`             | `5432`          | PostgreSQL portja                         |
| `POSTGRES_USER`             | `elyos`         | PostgreSQL felhasználónév                 |
| `POSTGRES_PASSWORD`         | `elyos123`      | PostgreSQL jelszó                         |
| `POSTGRES_DB`               | `elyos`         | PostgreSQL adatbázis neve                 |
| `INFISICAL_CLIENT_ID`       | -               | Infisical Machine Identity Client ID      |
| `INFISICAL_CLIENT_SECRET`   | -               | Infisical Machine Identity Client Secret  |
| `VARLOCK_FALLBACK`          | -               | Varlock fallback mód (`local`)            |
| `RESET`                     | -               | Adatbázis reset (`1` = teljes reset)      |

:::note[Teljes lista]
Az összes elérhető környezeti változó listájáért lásd a [Változók referencia](/configuration) dokumentációt.
:::

## Hibaelhárítás

### Konténer nem indul el

**Probléma:** A konténer azonnal leáll indítás után.

**Megoldás:**

1. Ellenőrizd a naplókat:
   ```bash
   docker logs elyos-app
   ```

2. Ellenőrizd a környezeti változókat:
   ```bash
   docker exec elyos-app env
   ```

3. Ellenőrizd a health check-et:
   ```bash
   docker inspect elyos-app | grep -A 10 Health
   ```

### Adatbázis kapcsolat hiba

**Probléma:** `ECONNREFUSED` vagy `Connection refused` hiba.

**Megoldás:**

1. Ellenőrizd, hogy a `postgres` konténer fut-e:
   ```bash
   docker ps | grep postgres
   ```

2. Ellenőrizd a `DATABASE_URL` környezeti változót:
   ```bash
   # Helyes formátum:
   postgresql://elyos:elyos123@postgres:5432/elyos
   ```

3. Várj, amíg a `postgres` konténer egészséges lesz:
   ```bash
   docker compose -f docker/docker-compose.yml ps
   ```

### Port már használatban

**Probléma:** `Bind for 0.0.0.0:3000 failed: port is already allocated`.

**Megoldás:**

1. Változtasd meg a portot a `.env` fájlban:
   ```bash
   ELYOS_PORT=3001
   ```

2. Vagy állítsd le a másik szolgáltatást:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Volume permission hiba

**Probléma:** `Permission denied` hiba a `uploads` mappában.

**Megoldás:**

1. Ellenőrizd a mappa jogosultságait:
   ```bash
   ls -la apps/web/uploads
   ```

2. Állítsd be a megfelelő jogosultságokat:
   ```bash
   chmod -R 755 apps/web/uploads
   ```

### Image build hiba

**Probléma:** `failed to solve: failed to compute cache key` hiba.

**Megoldás:**

1. Töröld a Docker cache-t:
   ```bash
   docker builder prune -a
   ```

2. Build újra:
   ```bash
   docker build -f docker/Dockerfile -t elyos/core:latest .
   ```

### Varlock hiba

**Probléma:** `Varlock failed to fetch secrets` hiba.

**Megoldás:**

1. Ellenőrizd az Infisical credentials-t:
   ```bash
   echo $INFISICAL_CLIENT_ID
   echo $INFISICAL_CLIENT_SECRET
   ```

2. Vagy használd a lokális fallback módot:
   ```bash
   VARLOCK_FALLBACK=local bun docker:up
   ```

## További információk

- [Első lépések](/getting-started) — lokális fejlesztési környezet beállítása
- [Környezeti változók](/environment) — környezeti változók részletes leírása
- [Scripts referencia](/scripts) — összes elérhető script parancs
- [Docker dokumentáció](https://docs.docker.com) — hivatalos Docker dokumentáció
- [OrbStack dokumentáció](https://docs.orbstack.dev) — OrbStack használati útmutató
