---
title: Environment Schema Validation
description: Typesafe validation of environment variables with Varlock – schema format, types, and error messages
---

Racona uses **Varlock** for typesafe validation of all environment variables. Varlock runs at application startup — before `node server.js` — so configuration errors are caught immediately.

**Detailed documentation:**
- [Varlock Official Site](https://varlock.dev/) — complete Varlock documentation
- [Environment Variables →](/en/environment) — Racona-specific usage

## The Env_Schema File

The type and validation rules for all environment variables are defined in `apps/web/.env.schema`. This is the single source of truth — Varlock generates TypeScript types from this.

```dotenv
# apps/web/.env.schema
# @generateTypes(lang=ts, path=src/env.d.ts)
# @defaultRequired=false

# Bootstrap credentials (required, comes from local .env file)
# @required @type=infisicalClientId
INFISICAL_CLIENT_ID=

# @required @type=infisicalClientSecret @sensitive
INFISICAL_CLIENT_SECRET=

# @required @type=enum(development, production, test)
NODE_ENV=development

# @required @type=url @sensitive
DATABASE_URL=

# @type=port
ELYOS_PORT=3000

# @sensitive @required
BETTER_AUTH_SECRET=

# @required @type=url
BETTER_AUTH_URL=
```

The `@generateTypes` decorator causes Varlock to automatically generate a `src/env.d.ts` TypeScript types file — don't edit this manually.

## Supported Types and Decorators

| Decorator / Type                     | Description                                         |
| ------------------------------------ | --------------------------------------------------- |
| `@required`                          | Required variable — missing it stops the app        |
| `@sensitive`                         | Sensitive data — not logged                         |
| `@type=string`                       | String type                                         |
| `@type=number` / `@type=port`        | Number / port type                                  |
| `@type=boolean`                      | Boolean type                                        |
| `@type=url`                          | URL validation                                      |
| `@type=enum(a, b, c)`                | Enumerated values                                   |
| `@type=string(startsWith=prefix_)`   | Prefix validation (e.g., `re_` for Resend API key)  |
| `@type=number(min=1, max=100)`       | Number range validation                             |
| `@type=infisicalClientId`            | Infisical Machine Identity client ID                |
| `@type=infisicalClientSecret`        | Infisical Machine Identity client secret            |

## Conditional Requirement

Varlock supports conditional requirement, where a variable is only required if another variable meets a condition:

```dotenv
# Email provider selection
# @type=enum(smtp,resend,sendgrid,ses)
EMAIL_PROVIDER=smtp

# SMTP variables — only required when EMAIL_PROVIDER=smtp
# @required=eq($EMAIL_PROVIDER, smtp)
SMTP_HOST=

# @type=port @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PORT=587

# @sensitive @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PASSWORD=

# Resend variables — only required when EMAIL_PROVIDER=resend
# @sensitive @required=eq($EMAIL_PROVIDER, resend)
RESEND_API_KEY=
```

## Interpolation and Functions

You can use variable interpolation and functions in the schema:

```dotenv
# Interpolation
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# Fallback values
APP_URL=fallback(ref('ORIGIN'),'')
SMTP_FROM_EMAIL=fallback(ref("SMTP_USERNAME"),'')
```

## Accessing Environment Values in Application

The `src/lib/env.ts` re-exports Varlock-validated `process.env` values in a typesafe way:

```typescript
import { env } from '$lib/env';

// Typesafe, already validated by Varlock at startup
const dbUrl = env.DATABASE_URL;
const port = env.ELYOS_PORT;
```

## Error Messages

If validation fails, Varlock logs the specific error and stops the application:

```
[Varlock] ERROR: Missing bootstrap credential: INFISICAL_CLIENT_ID
[Varlock] ERROR: Missing required secret: DATABASE_URL
[Varlock] ERROR: Type validation failed: SMTP_PORT — expected: number, got: "invalid"
[Varlock] ERROR: Invalid enum value: NODE_ENV — expected: development|production|test, got: "staging"
```

On successful startup:

```
[Varlock] 42 secrets loaded successfully (production/elyos-core)
[Varlock] Type generation complete: src/env.d.ts
```

## Further Information

**Detailed documentation:**
- [Environment Variables →](/en/environment) — complete Racona environment variable management
- [Varlock Official Site](https://varlock.dev/) — Varlock documentation and API reference
