---
title: Varlock Schema Format
description: The .env.schema file format, annotations, types, and functions
prev:
  link: /en/environment/
  label: Environment Variables
---

The `.env.schema` file is a specially formatted `.env` file that contains Varlock annotations. It is the single source of truth for environment variable types and validation rules.

**File:** `apps/web/.env.schema`

## Example Schema

```dotenv
# @import(../../.env.local, allowMissing=true)
# @currentEnv=$NODE_ENV
# @defaultRequired=false @defaultSensitive=false
# @generateTypes(lang=ts, path=src/env.d.ts)
# ---

# @required @type=enum(development,production,test)
NODE_ENV=development

# @type=number
BODY_SIZE_LIMIT=10485760

# @type=port
ELYOS_PORT=3000

# @required @type=url
ORIGIN=

# @type=url
APP_URL=fallback(ref('ORIGIN'),'')

# @required @sensitive
POSTGRES_USER=

# @required @sensitive
POSTGRES_PASSWORD=

# @required
POSTGRES_HOST=localhost

# @required @type=url @sensitive
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

## Global Annotations

At the top of the file, before the `# ---` line:

- **`@import(path, allowMissing=true)`** — import another env file
- **`@currentEnv=$NODE_ENV`** — determine the current environment
- **`@defaultRequired=false`** — variables are not required by default
- **`@defaultSensitive=false`** — variables are not sensitive by default
- **`@generateTypes(lang=ts, path=...)`** — TypeScript type generation

## Variable Annotations

### Types

| Annotation | Description | Example |
|-----------|--------|-------|
| `@type=string` | String value (default) | `APP_NAME=Racona` |
| `@type=number` | Numeric value | `BODY_SIZE_LIMIT=10485760` |
| `@type=number(min=1,max=100)` | Numeric value with range | `DEMO_RESET_HOUR=3` |
| `@type=port` | Port number (1–65535) | `ELYOS_PORT=3000` |
| `@type=url` | URL format | `ORIGIN=http://localhost:3000` |
| `@type=email(normalize=true)` | Email address with normalization | `SMTP_FROM_EMAIL=noreply@racona.hu` |
| `@type=enum(a,b,c)` | Enumeration type | `NODE_ENV=development` |
| `@type=boolean` | Boolean value | `DEV_MODE=true` |

### Required

- **`@required`** — required variable, its absence stops the application
- **`@required=eq($VAR, value)`** — conditional requirement

**Example of conditional requirement:**

```dotenv
# @type=enum(smtp,resend,sendgrid,ses)
EMAIL_PROVIDER=smtp

# Only required if EMAIL_PROVIDER=smtp
# @required=eq($EMAIL_PROVIDER, smtp)
SMTP_HOST=

# @type=port @required=eq($EMAIL_PROVIDER, smtp)
SMTP_PORT=587
```

### Sensitivity

- **`@sensitive`** — sensitive data, not logged

```dotenv
# @required @sensitive
BETTER_AUTH_SECRET=

# @required @type=url @sensitive
DATABASE_URL=
```

### Default Value

- **`@default=value`** — default value if not provided

```dotenv
# @type=port @default=3000
ELYOS_PORT=3000
```

## Functions

### ref(varName)

Reference to another variable:

```dotenv
APP_URL=fallback(ref('ORIGIN'),'')
SMTP_FROM_EMAIL=fallback(ref('SMTP_USERNAME'),'')
```

### fallback(value1, value2)

Use the first non-empty value:

```dotenv
# If ORIGIN is empty, use empty string
APP_URL=fallback(ref('ORIGIN'),'')

# If SMTP_USERNAME is empty, use 'noreply@racona.hu'
SMTP_FROM_EMAIL=fallback(ref('SMTP_USERNAME'),'noreply@racona.hu')
```

### Interpolation

Embed variables using `${VAR}` syntax:

```dotenv
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

## Type Generation

The `@generateTypes` annotation causes Varlock to automatically generate a TypeScript type file:

```dotenv
# @generateTypes(lang=ts, path=src/env.d.ts)
```

**Generated file:** `apps/web/src/env.d.ts`

```typescript
export type CoercedEnvSchema = {
  NODE_ENV: "development" | "production" | "test";
  BODY_SIZE_LIMIT: number;
  ELYOS_PORT: number;
  ORIGIN: string;
  APP_URL?: string;
  DATABASE_URL: string;
  // ...
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaAsStrings {}
  }
}
```

This enables type-safe access:

```typescript
// ✅ Type-safe
const port = process.env.ELYOS_PORT;

// ❌ TypeScript error
const invalid = process.env.INVALID_VAR;
```

## Best Practices

1. **Use descriptive names** — `SMTP_HOST` is better than `SH`
2. **Group variables** — mark categories with comments
3. **Provide default values** — for development environments
4. **Use conditional requirements** — only required variables should be mandatory
5. **Mark sensitive data** — with the `@sensitive` annotation

## Next Steps

- [Runtime validation →](/en/environment-runtime) — schema.ts in detail
- [Infisical integration →](/en/environment-infisical) — secrets management
- [Adding a new variable →](/en/environment-add-variable) — step by step
