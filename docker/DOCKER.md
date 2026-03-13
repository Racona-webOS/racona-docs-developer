# Docker – Dokumentációs oldal

Ez a dokumentáció a dokumentációs oldal (`docs.elyos.hu`) Docker image buildelését és deployolását írja le.

---

## Image buildelése

A build parancsokat a **projekt gyökérkönyvtárából** kell futtatni.

```bash
# Natív architektúrára (lokális teszteléshez)
bun run docker:build

# Linux amd64 (VPS deploy esetén)
bun run docker:build:amd64

# Linux arm64
bun run docker:build:arm64

# Export .tar fájlba
bun run docker:save
```

---

## Környezeti változók

A `docker-compose.yml` mellé hozz létre egy `.env` fájlt:

```env
# Umami Analytics (opcionális)
UMAMI_WEBSITE_ID_DOCS=<uuid>

# GitHub repository URL (opcionális)
GITHUB_URL=https://github.com/ElyOS-webOS/elyos-core
```

---

## Futtatás

```bash
cd docker
docker compose up -d
```

A konténer a `3001`-es porton fut (nginx a `80`-as porton belül), és az `elyos_shared` Docker hálózaton keresztül érhető el a Traefik proxy számára.

> Az `elyos_shared` hálózatnak léteznie kell a konténer indítása előtt. Ha saját hálózatot használsz, a `docker-compose.yml`-ben cseréld le a hálózat nevét, vagy hozd létre manuálisan:
>
> ```bash
> docker network create elyos_shared
> ```

---

## Deploy VPS-re

### 1. Build és export lokálisan

```bash
bun run docker:build:amd64
bun run docker:save
```

### 2. Felmásolás és betöltés VPS-en

```bash
scp docker/elyos-docs.tar user@vps:/opt/docker/_images/

ssh user@vps
docker load -i /opt/docker/_images/elyos-docs.tar
```

### 3. Indítás

```bash
cd /opt/docker/elyos-docs
docker compose up -d
```

---

## Traefik routing

A mellékelt `docker-compose.yml` az ElyOS saját VPS-környezetéhez van konfigurálva, ahol Traefik reverse proxy fut:

- **Domain**: `docs.elyos.hu`
- **Port**: `3001` (host) → `80` (nginx konténer)
- **Healthcheck**: `GET /` – 30 másodpercenként

Más környezetbe deployolás esetén:

- **Van Traefik**: a `labels` blokkot az adott szerver konfigurációjának megfelelően kell módosítani (domain, entrypoint, stb.)
- **Nincs Traefik**: a `labels` blokk elhagyható, a `3001`-es portot közvetlenül kell exponálni, és a forgalmat saját proxy (nginx, Caddy, stb.) vagy portforward kezeli

---

## Hasznos parancsok

```bash
# Logok követése
docker compose logs -f docs

# Konténer állapota
docker compose ps

# Újraindítás
docker compose restart docs

# Leállítás
docker compose down
```
