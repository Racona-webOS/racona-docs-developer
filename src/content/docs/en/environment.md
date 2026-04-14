---
title: Environment Variables
description: Managing environment variables in Racona — Varlock, Infisical, and typesafe configuration
---

The Racona project uses **Varlock** for typesafe environment variable management. This ensures all configuration is validated and type-safe before the application starts.

## Why It Matters

Environment variable management is critical for application functionality:

- **Database connection** — without `DATABASE_URL`, the application won't start
- **Authentication** — `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are required
- **Email sending** — SMTP or other email provider settings
- **Secrets management** — Infisical integration for secure secrets handling

## Three-Layer Architecture

Racona environment variable management consists of three layers:

### 1. Varlock Schema (`.env.schema`)

The **source of type definitions and annotations**. The TypeScript types file `env.d.ts` is generated from this.

**File:** `apps/web/.env.schema`

**Details:** [Varlock Schema Format →](/en/environment-schema)

### 2. Runtime Validation (`schema.ts`)

The **runtime validation logic** in TypeScript. This validates values loaded from Infisical or `.env` file.

**File:** `apps/web/src/lib/secrets/schema.ts`

**Details:** [Runtime Validation →](/en/environment-runtime)

### 3. Central Env Module (`env.ts`)

The **typesafe access point** from application code.

**File:** `apps/web/src/lib/env.ts`

**Usage:**
```typescript
import { env } from '$lib/env';

const port = env.ELYOS_PORT;        // number
const devMode = env.DEV_MODE;       // boolean
const dbUrl = env.DATABASE_URL;     // string
```

## Startup Modes

### Development (Local .env)

```bash
bun app:dev
```

Loads variables from `.env.local` file. Fast and simple for local development.

### Development (Varlock + Infisical)

```bash
bun app:dev:varlock
```

Loads variables from Infisical. Use for testing if you want configuration similar to production.

### Production (Docker)

```dockerfile
CMD ["varlock", "run", "--", "bun", "run", "apps/web/server.js"]
```

Only bootstrap credentials are in the `.env` file, everything else comes from Infisical.

**Details:** [Startup Modes and Infisical →](/en/environment-infisical)

## Adding a New Variable

If you add a new environment variable, you need to update **3 places**:

1. **`.env.schema`** — with Varlock annotations
2. **`schema.ts`** — in 4 places (EXPECTED_KEYS, REQUIRED_KEYS, validateSchema, validEnvArbitrary)
3. **`.env.example`** — with example value

**Detailed guide:** [Adding a New Variable →](/en/environment-add-variable)

## File Structure

```
elyos-core/
├── .env.example                          # Example configuration
├── .env.local                            # Local development variables (gitignore)
├── apps/web/
│   ├── .env.schema                       # Varlock schema (@generateTypes)
│   ├── src/
│   │   ├── env.d.ts                      # Generated TypeScript types
│   │   ├── lib/
│   │   │   ├── env.ts                    # Central env export
│   │   │   └── secrets/
│   │   │       ├── varlock.ts            # Infisical integration
│   │   │       └── schema.ts             # Runtime validation
│   │   └── server.js                     # Express + Socket.IO server
│   └── vite.config.ts                    # envDir: '../..'
```

## Benefits

- **Type Safety** — full TypeScript support
- **Validation** — schema-based validation at startup and runtime
- **Secrets Management** — centralized Infisical integration
- **Fallback** — local development support
- **Coercion** — automatic type conversion (string → boolean/number)
- **Token Renewal** — automatic token refresh
- **Retry Logic** — fault-tolerant connection (3 retries)

## Next Steps

- [Varlock Schema Format →](/en/environment-schema) — annotations, types, functions
- [Infisical Integration →](/en/environment-infisical) — bootstrap credentials, how it works
- [Runtime Validation →](/en/environment-runtime) — schema.ts in detail
- [Adding a New Variable →](/en/environment-add-variable) — step-by-step guide
