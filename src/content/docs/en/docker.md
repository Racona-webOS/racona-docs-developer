---
title: Docker
description: Using Docker in Racona development and deployment
---

Racona fully supports Docker-based development and deployment. This document details how to use Docker with Racona.

## Why Docker?

Using Docker provides several benefits:

- **Consistent environment** — every developer and server uses the same environment
- **Simple setup** — no need to install Node.js, Bun, or PostgreSQL locally
- **Isolated services** — database and application run in separate containers
- **Quick startup** — entire system starts with a single command
- **Reproducible builds** — Docker image always builds the same way

## Prerequisites

### Installing Docker

Install Docker on your system:

- **macOS:** [OrbStack](https://orbstack.dev) (recommended) or [Docker Desktop](https://docker.com)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/)
- **Windows:** [Docker Desktop](https://docker.com)

:::tip[OrbStack for macOS]
macOS users are strongly recommended to use **OrbStack** instead of Docker Desktop:

- Significantly faster container and VM startup
- Fraction of memory and CPU usage
- Native macOS Keychain integration
- Much smaller application size
- Free for personal use

[Install OrbStack →](https://orbstack.dev)
:::

### Installing Bun (Optional)

Installing Bun is not required but makes running Docker commands easier:

```bash
curl -fsSL https://bun.sh/install | bash
```

Docker can be used without Bun, just run raw `docker compose` commands.

## Quick Start with Docker

### 1. Clone Repository

```bash
git clone https://github.com/Racona-webOS/elyos-core
cd elyos-core
```

### 2. Configure Environment Variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

**With Varlock + Infisical (recommended):**

```bash
# .env
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

**Without Infisical (local fallback mode):**

```bash
# .env
VARLOCK_FALLBACK=local
# ... fill in all variables from .env.example
```

:::note[Environment Variables]
For detailed environment variable descriptions, see [Environment Variables](/en/environment) documentation.
:::

### 3. Start System

Racona supports three deployment modes:

#### Full stack (recommended)

Postgres + db-init + app, all in one:

```bash
bun docker:up
# or
docker compose -f docker/docker-compose.yml up -d
```

#### Bundle mode (postgres + app, SQL-based init)

Ideal when you want to initialize the database from a pre-generated SQL file, without a db-init container:

```bash
# Generate init SQL (only once, or after schema changes)
bun db:generate-sql

# Start postgres + app
bun docker:up:bundle
# or
docker compose -f docker/docker-compose.bundle.yml up -d
```

The `init.sql` is automatically loaded on first startup. Full reset: `docker compose -f docker/docker-compose.bundle.yml down -v`.

#### App only (external database)

If you manage your own PostgreSQL instance:

```bash
bun docker:up:app
# or
docker compose -f docker/docker-compose.app.yml up -d
```

Set `DATABASE_URL` in your `.env` to point to your database. Migrations and seeding must be done manually.

### 4. Open Application

Open in browser: [http://localhost:3000](http://localhost:3000)

## Docker Compose Services

The `docker/docker-compose.yml` file defines three services that start in order:

### 1. postgres

PostgreSQL 18 database with custom image including `postgres-json-schema` extension.

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

**Features:**

- Port: `5432` (configurable: `POSTGRES_PORT`)
- Persistent storage: `elyos-data` volume
- Health check: checks database availability every 10 seconds
- Auto-restart: `unless-stopped`

### 2. db-init

One-time initialization: runs Drizzle migrations and loads seed data.

```yaml
db-init:
  command: >
    sh -c 'bun --filter @elyos/database db:init ${RESET:+-- --reset}'
  depends_on:
    postgres:
      condition: service_healthy
  restart: 'no'
```

**Features:**

- Only starts when `postgres` service is healthy
- Runs `bun db:init` command
- One-time execution: `restart: no`
- Supports `RESET=1` environment variable for complete database reset

### 3. elyos

Racona web application (SvelteKit + Express + Socket.IO).

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

**Features:**

- Port: `3000` (configurable: `ELYOS_PORT`)
- Only starts when `db-init` completes successfully
- Persistent file storage: `uploads` folder
- Auto-restart: `unless-stopped`
- Health check: checks `/api/health` endpoint every 30 seconds

## Startup Order

Services start in sequence, ensuring proper dependencies:

```
1. postgres (starts)
   ↓
2. postgres (healthy)
   ↓
3. db-init (starts and runs)
   ↓
4. db-init (completed successfully)
   ↓
5. elyos (starts)
```

## Database Initialization and Reset

### Normal Initialization

The `db-init` container is **idempotent** — safe to run multiple times, doesn't duplicate data (upsert logic).

```bash
bun docker:up
```

### Complete Database Reset

If complete database reset is needed (delete all data and reseed):

```bash
RESET=1 bun docker:up
```

This runs the same `db-init` container but truncates all tables before seeding.

**Without Bun:**

```bash
RESET=1 docker compose -f docker/docker-compose.yml up -d
```

## Development with Docker

### Hot Reload Support

Docker-based development supports hot reload via volume mount. Modify `docker-compose.yml`:

```yaml
elyos:
  volumes:
    - ../apps/web:/app/apps/web
    - ../packages:/app/packages
  command: bun run app:dev
```

:::caution[Performance]
Volume mount can be slower on macOS and Windows. For active development, [local development mode](/en/getting-started#local-development) is recommended.
:::

### Running Database Only

If you want only the database in Docker and run the application locally:

```bash
bun docker:db
```

This starts only the `postgres` service.

**Without Bun:**

```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

## Docker Commands

### Basic Commands

```bash
# Start containers (background)
bun docker:up
# or
docker compose -f docker/docker-compose.yml up -d

# Stop containers
bun docker:down
# or
docker compose -f docker/docker-compose.yml down

# Follow container logs
bun docker:logs
# or
docker compose -f docker/docker-compose.yml logs -f

# Start PostgreSQL only
bun docker:db
# or
docker compose -f docker/docker-compose.yml up -d postgres
```

### Checking Container Status

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs elyos-app
docker logs elyos-postgres
docker logs elyos-db-init
```

### Entering Containers

```bash
# Enter Racona container
docker exec -it elyos-app sh

# Enter PostgreSQL container
docker exec -it elyos-postgres psql -U elyos -d elyos
```

### Cleaning Up

```bash
# Remove containers and network
docker compose -f docker/docker-compose.yml down

# Remove containers, network, and volumes (database data too)
docker compose -f docker/docker-compose.yml down -v

# Remove images
docker rmi elyos-elyos elyos-postgres
```

## Multi-Stage Build

The `docker/Dockerfile` uses an optimized multi-stage build with three phases:

### 1. deps — Install Dependencies

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile
```

**Features:**

- Copies only `package.json` and `bun.lock` files
- Cacheable layer — if dependencies don't change, this layer comes from cache
- Frozen lockfile — reproducible build

### 2. builder — Build Application

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY packages/database ./packages/database
ENV NODE_ENV=production
RUN bun run app:build
```

**Features:**

- Copies dependencies from `deps` phase
- Copies source code
- Runs SvelteKit build (`adapter-node` output)

### 3. runner — Production Image

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

**Features:**

- Alpine Linux-based image — minimal size
- Non-root user — security
- Production dependencies only
- Global Varlock installation — secrets management
- Health check — checks `/api/health` endpoint

## Building Images

### Local Build

```bash
docker build -f docker/Dockerfile -t racona/core:latest .
```

### Build Arguments

```bash
docker build \
  -f docker/Dockerfile \
  -t racona/core:latest \
  --build-arg NODE_ENV=production \
  .
```

### Multi-Platform Build

```bash
docker buildx build \
  -f docker/Dockerfile \
  -t racona/core:latest \
  --platform linux/amd64,linux/arm64 \
  .
```

## Environment Variables

Docker Compose automatically loads the root `.env` file. The following variables are configurable:

| Variable                    | Default | Description                                   |
| --------------------------- | ------- | --------------------------------------------- |
| `ELYOS_PORT`                | `3000`  | Racona application port                        |
| `POSTGRES_PORT`             | `5432`  | PostgreSQL port                               |
| `POSTGRES_USER`             | `elyos` | PostgreSQL username                           |
| `POSTGRES_PASSWORD`         | `elyos123` | PostgreSQL password                        |
| `POSTGRES_DB`               | `elyos` | PostgreSQL database name                      |
| `INFISICAL_CLIENT_ID`       | -       | Infisical Machine Identity Client ID          |
| `INFISICAL_CLIENT_SECRET`   | -       | Infisical Machine Identity Client Secret      |
| `VARLOCK_FALLBACK`          | -       | Varlock fallback mode (`local`)               |
| `RESET`                     | -       | Database reset (`1` = complete reset)         |

:::note[Full List]
For all available environment variables, see [Variables Reference](/en/configuration) documentation.
:::

## Troubleshooting

### Container Won't Start

**Problem:** Container stops immediately after starting.

**Solution:**

1. Check logs:
   ```bash
   docker logs elyos-app
   ```

2. Check environment variables:
   ```bash
   docker exec elyos-app env
   ```

3. Check health check:
   ```bash
   docker inspect elyos-app | grep -A 10 Health
   ```

### Database Connection Error

**Problem:** `ECONNREFUSED` or `Connection refused` error.

**Solution:**

1. Check if `postgres` container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check `DATABASE_URL` environment variable:
   ```bash
   # Correct format:
   postgresql://elyos:elyos123@postgres:5432/elyos
   ```

3. Wait for `postgres` container to be healthy:
   ```bash
   docker compose -f docker/docker-compose.yml ps
   ```

### Port Already in Use

**Problem:** `Bind for 0.0.0.0:3000 failed: port is already allocated`.

**Solution:**

1. Change port in `.env` file:
   ```bash
   ELYOS_PORT=3001
   ```

2. Or stop the other service:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

## Further Information

- [Getting Started](/en/getting-started) — local development environment setup
- [Environment Variables](/en/environment) — detailed environment variables description
- [Scripts Reference](/en/scripts) — all available script commands
- [Docker Documentation](https://docs.docker.com) — official Docker documentation
- [OrbStack Documentation](https://docs.orbstack.dev) — OrbStack usage guide
