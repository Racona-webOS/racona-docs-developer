---
title: Getting Started
description: Setting up the development environment, installing dependencies, and running Racona locally
---

## Prerequisites

The following are required for development:

- **[Bun](https://bun.sh)** v1.0+ — runtime and package manager
- **[Node.js](https://nodejs.org)** v20+ — required for the web application
- **[Docker](https://docker.com)** and Docker Compose — for PostgreSQL
- **[Git](https://git-scm.com)** v2.30+

:::tip
On macOS, consider using [OrbStack](https://orbstack.dev) instead of Docker Desktop — it's significantly faster and uses fewer resources.
:::

## Installation

### 1. Clone

```bash
git clone https://github.com/Racona-webOS/elyos-core.git
cd elyos-core
```

### 2. Dependencies

```bash
bun install
```

### 3. Environment Variables

```bash
cp .env.example .env
```

Racona uses **Varlock** for typesafe environment management. In the `.env` file, only **bootstrap credentials** are required — all other secrets come from Infisical at startup.

**Detailed documentation:** [Environment Variables →](/en/environment)

**With Infisical access (recommended):**

```dotenv
INFISICAL_CLIENT_ID=machine-identity-client-id
INFISICAL_CLIENT_SECRET=machine-identity-client-secret
```

To request Infisical access, contact your team's system administrator. Machine Identity credentials can be found in the Infisical dashboard under project settings.

**Without Infisical (local fallback mode):**

If you don't have Infisical access or are working offline, set `VARLOCK_FALLBACK=local` and provide all required variables directly in `.env`:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=generated-random-secret
BETTER_AUTH_URL=http://localhost:3000
ORIGIN=http://localhost:5173
```

:::caution
The `ORIGIN` variable must match your dev server URL (`http://localhost:5173`). Without this, remote function calls will fail with 403 errors due to SvelteKit's CSRF protection.
:::

:::tip[Scripts Reference]
Detailed descriptions of the commands below can be found on the [Scripts Reference](/en/scripts) page, or scroll down to the [Useful Commands](#useful-commands) section.
:::

### 4. Start Database

```bash
bun docker:db      # PostgreSQL container only
bun db:init        # Migrations + seed data
```

**What these commands do:**
- `docker:db` — starts the PostgreSQL container in Docker
- `db:init` — complete database initialization (generate + migrate + seed)

**Details:** [Scripts Reference →](/en/scripts)

### 5. Development Server

```bash
bun app:dev
```

The application is available at: `http://localhost:5173`

**What it does:** Starts the SvelteKit dev server with local `.env` file (without Varlock).

**Details:** [Scripts Reference →](/en/scripts)

:::note
In development mode (`bun app:dev`), Varlock does not run — the SvelteKit dev server reads variables directly from the `.env` file. `varlock run` is only active when starting the production build (`node server.js`).
:::

### Default Admin Account

After seeding, the first user receives admin privileges. The email address is read from the `ADMIN_USER_EMAIL` environment variable.

```dotenv
# .env
ADMIN_USER_EMAIL=admin@example.com
```

| Field    | Value                                                    |
| -------- | -------------------------------------------------------- |
| Email    | the value of `ADMIN_USER_EMAIL` (or seed default)        |
| Password | `Admin1234!`                                             |

:::tip
In production deployments, always set the `ADMIN_USER_EMAIL` variable so the seed doesn't create the admin account with a generic email address.
:::

---

## Docker-based Execution

The entire stack (Racona + PostgreSQL) can also be started with Docker Compose:

```bash
bun docker:up
```

In this case, Varlock runs when the container starts (`varlock run -- node server.js`), and loads secrets from Infisical. Only bootstrap credentials are required in the `.env` file.

**Details:** [Scripts Reference → Docker](/en/scripts#docker)

---

## Useful Commands

**Full list:** [Scripts Reference →](/en/scripts)

```bash
# Development
bun app:dev           # Dev server
bun app:build         # Production build
bun app:check         # Type checking (svelte-check + tsc)

# Database
bun db:generate       # Generate migrations from schema changes
bun db:migrate        # Run pending migrations
bun db:seed           # Load seed data
bun db:reset          # Reset database
bun db:studio         # Open Drizzle Studio

# Docker
bun docker:db         # Start PostgreSQL only
bun docker:up         # Full stack (Racona + DB)
bun docker:down       # Stop
bun docker:logs       # Follow logs

# Testing (from apps/web directory)
bun test              # Run all tests once
bun test:pbt          # Property-based tests only

# Code quality (from apps/web directory)
bun lint              # Prettier + ESLint check
bun format            # Automatic formatting
```

## Opening the Project

Open the monorepo root in your IDE. The main development area is the `apps/web/src/` folder.

```
elyos-core/
├── apps/web/src/        ← where you'll work most
├── apps/web/.env.schema ← env variables schema (Varlock)
├── packages/database/   ← schema and migrations
└── .env                 ← bootstrap credentials (locally)
```
