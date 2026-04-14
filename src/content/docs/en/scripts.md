---
title: Scripts Reference
description: All available npm/bun scripts for development, building, testing, and Docker management
---

Racona is a **Bun workspaces** based monorepo. The root `package.json` contains main commands that invoke workspace package scripts.

## Monorepo Structure

```
elyos-core/
├── package.json              # Root scripts (using bun --filter)
├── apps/
│   └── web/
│       └── package.json      # @elyos/core scripts
└── packages/
    └── database/
        └── package.json      # @elyos/database scripts
```

**Important:** Root scripts can be run from anywhere in the monorepo. Scripts specific to `apps/web` must be run from the `apps/web` directory.

---

## Development

### `bun app:dev`

**Location:** Root
**Runs:** `apps/web` → `dev` script

Starts SvelteKit dev server with **local .env file** (without Varlock).

```bash
bun app:dev
```

**What it does:**
- Loads `../../.env` file (root `.env`)
- Starts Vite dev server (`http://localhost:5173`)
- Hot module replacement (HMR) enabled

**When to use:** Local development, fast iteration.

---

### `bun app:dev:varlock`

**Location:** Root
**Runs:** `apps/web` → `dev:varlock` script

Starts SvelteKit dev server with **Varlock** (Infisical secrets).

```bash
bun app:dev:varlock
```

**What it does:**
- Varlock loads secrets from Infisical
- Validates environment variables
- Starts Vite dev server

**When to use:** Testing configuration similar to production.

---

## Build and Preview

### `bun app:build`

**Location:** Root
**Runs:** `apps/web` → `build` script

Creates production build.

```bash
bun app:build
```

**What it does:**
- SvelteKit production build (`vite build`)
- Adapter-node output: `apps/web/build/`
- Static assets: `apps/web/build/client/`

---

### `bun app:preview`

**Location:** `apps/web`
**Runs:** `preview` script

Starts production build locally.

```bash
cd apps/web
bun preview
```

**What it does:**
- Starts Express + Socket.IO server (`server.js`)
- Serves built application
- Port: `process.env.PORT` or `3000`

**Prerequisite:** Run `bun app:build` first.

---

## Type Checking

### `bun app:check`

**Location:** Root
**Runs:** `apps/web` → `check` script

TypeScript and Svelte type checking.

```bash
bun app:check
```

**What it does:**
- `svelte-kit sync` — generates SvelteKit types
- `svelte-check` — checks Svelte components
- `tsc` — TypeScript type checking

**When to use:** Before commit, in CI/CD.

---

## Database

### `bun db:init`

**Location:** Root
**Runs:** `packages/database` → `db:init` script

**First startup** — complete database initialization.

```bash
bun db:init
```

**What it does:**
1. `db:generate` — generate migrations
2. `db:migrate` — run migrations
3. `db:seed` — load seed data

**When to use:** First installation or after complete reset.

---

### `bun db:generate`

**Location:** Root
**Runs:** `packages/database` → `db:generate` script

Generate Drizzle migrations from schema changes.

```bash
bun db:generate
```

**What it does:**
- Compares `src/schemas/` files with database
- Generates SQL migration files in `drizzle/` folder

**When to use:** After schema modification (new table, column, index, etc.).

---

### `bun db:migrate`

**Location:** Root
**Runs:** `packages/database` → `db:migrate` script

Run pending migrations.

```bash
bun db:migrate
```

**What it does:**
- Runs all new migrations from `drizzle/` folder
- Updates `__drizzle_migrations` table

---

### `bun db:seed`

**Location:** Root
**Runs:** `packages/database` → `db:seed` script

Load seed data.

```bash
bun db:seed
```

**What it does:**
- Runs seed scripts from `src/seeds/` folder
- Creates admin user (based on `ADMIN_USER_EMAIL`)
- Loads default applications, roles, etc.

---

### `bun db:studio`

**Location:** Root
**Runs:** `packages/database` → `db:studio` script

Open Drizzle Studio.

```bash
bun db:studio
```

**What it does:**
- Starts Drizzle Studio web interface
- Opens in browser: `https://local.drizzle.studio`
- Visual database browser and editor

---

### `bun db:reset`

**Location:** Root
**Runs:** `packages/database` → `db:reset` script

Complete database reset.

```bash
bun db:reset
```

**What it does:**
1. Drops all tables
2. Re-runs migrations
3. Loads seed data

**Warning:** All data is lost!

---

## Docker

### `bun docker:db`

**Location:** Root

Start PostgreSQL container only.

```bash
bun docker:db
```

**What it does:**
- Starts `postgres` service
- Port: `5432`
- Data: `docker/postgres-data/` (persistent)

**When to use:** Local development, database only.

---

### `bun docker:up`

**Location:** Root

Start full stack (Racona + PostgreSQL).

```bash
bun docker:up
```

**What it does:**
- Builds Docker image
- Starts `app` and `postgres` services
- Detached mode (`-d`)

**Available at:** `http://localhost:3000`

---

### `bun docker:down`

**Location:** Root

Stop all containers.

```bash
bun docker:down
```

**What it does:**
- Stops and removes containers
- Volumes remain (data not lost)

---

### `bun docker:logs`

**Location:** Root

Follow container logs.

```bash
bun docker:logs
```

**What it does:**
- Real-time container logs
- `Ctrl+C` to exit

---

## Testing

### `bun test`

**Location:** `apps/web`

Run all tests once.

```bash
cd apps/web
bun test
```

**What it does:**
- Vitest unit tests
- `--run` mode (not watch)

---

### `bun test:watch`

**Location:** `apps/web`

Run tests in watch mode.

```bash
cd apps/web
bun test:watch
```

**What it does:**
- Re-runs tests on file changes
- Interactive mode

---

### `bun test:pbt`

**Location:** `apps/web`

Run property-based tests only.

```bash
cd apps/web
bun test:pbt
```

**What it does:**
- Runs tests containing "Property"
- fast-check based tests

---

## Code Quality

### `bun lint`

**Location:** `apps/web`

Prettier and ESLint check.

```bash
cd apps/web
bun lint
```

**What it does:**
- `prettier --check .` — formatting check
- `eslint .` — code quality check

---

### `bun format`

**Location:** `apps/web`

Automatic code formatting.

```bash
cd apps/web
bun format
```

**What it does:**
- `prettier --write .` — formats all files

---

## Common Workflows

### First Startup

```bash
# 1. Dependencies
bun install

# 2. Env file
cp .env.example .env
# Edit .env file

# 3. Database
bun docker:db
bun db:init

# 4. Dev server
bun app:dev
```

### Schema Modification

```bash
# 1. Modify packages/database/src/schemas/ files

# 2. Generate migration
bun db:generate

# 3. Run migration
bun db:migrate

# 4. (Optional) Re-run seed
bun db:seed
```

### Production Build Testing

```bash
# 1. Build
bun app:build

# 2. Preview
cd apps/web
bun preview
```

### Docker Deployment

```bash
# 1. Env file (bootstrap credentials only)
cp .env.example .env
# INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET

# 2. Start
bun docker:up

# 3. Logs
bun docker:logs
```

---

## Next Steps

- [Environment Variables →](/en/environment) — Varlock and Infisical
- [Database →](/en/database) — Drizzle ORM and migrations
- [Testing →](/en/testing) — Unit and property-based tests
