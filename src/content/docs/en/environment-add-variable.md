---
title: Adding a New Variable
description: Step-by-step guide for adding a new environment variable
---

When adding a new environment variable to the Racona project, you need to update the code in **3 places**.

## Checklist

- [ ] `.env.schema` — with Varlock annotations
- [ ] `schema.ts` — in 4 places (EXPECTED_KEYS, REQUIRED_KEYS, validateSchema, validEnvArbitrary)
- [ ] `.env.example` — example value

## Example: Adding REDIS_URL

Suppose you are adding a Redis connection to the application.

### 1. Update the `.env.schema` file

**File:** `apps/web/.env.schema`

```dotenv
# Redis
# @type=string
# @description=Redis connection URL
# @optional
REDIS_URL=
```

**Annotations:**
- `@type=string` — string value (or `@type=url` if you want URL validation)
- `@description` — description of the variable
- `@optional` — not required (or `@required` if required)

### 2. Update the `schema.ts` file

**File:** `apps/web/src/lib/secrets/schema.ts`

#### a) EXPECTED_ENV_KEYS array

```typescript
export const EXPECTED_ENV_KEYS = [
  // ... existing variables
  'REDIS_URL'  // ← Add here
] as const;
```

#### b) REQUIRED_KEYS array (if required)

```typescript
export const REQUIRED_KEYS = [
  // ... existing variables
  'REDIS_URL'  // ← Only if required
] as const;
```

#### c) validateSchema function (if special validation is needed)

If you want URL validation:

```typescript
// URL type field validation
const urlFields = ['APP_URL', 'ORIGIN', 'BETTER_AUTH_URL', 'REDIS_URL'] as const;
for (const key of urlFields) {
  const value = env[key];
  if (value !== undefined && value !== null && value !== '') {
    if (!isValidUrl(value)) {
      errors.push(`Type validation failed: ${key} — expected: url, got: "${value}"`);
    }
  }
}
```

#### d) validEnvArbitrary function (for tests)

```typescript
export function validEnvArbitrary() {
  return fc.record({
    // ... existing variables
    REDIS_URL: fc.option(
      fc.string({ minLength: 1, maxLength: 128 }),
      { nil: undefined }
    ),
  });
}
```

### 3. Update the `.env.example` file

**File:** `.env.example` (project root)

```bash
# Redis
REDIS_URL=redis://localhost:6379
```

## Examples for Different Types

### String variable

```dotenv
# .env.schema
# @type=string
APP_NAME=Racona
```

```typescript
// schema.ts - validEnvArbitrary
APP_NAME: fc.option(
  fc.string({ minLength: 1, maxLength: 64 }),
  { nil: undefined }
),
```

### Number variable

```dotenv
# .env.schema
# @type=number
# @type=number(min=1, max=100)
MAX_CONNECTIONS=50
```

```typescript
// schema.ts - validateSchema
const numericRangeFields = [
  { key: 'MAX_CONNECTIONS', min: 1, max: 100 }
];

// schema.ts - validEnvArbitrary
MAX_CONNECTIONS: fc.option(
  fc.integer({ min: 1, max: 100 }).map(String),
  { nil: undefined }
),
```

### Boolean variable

```dotenv
# .env.schema
# @type=boolean
FEATURE_ENABLED=true
```

```typescript
// schema.ts - validateSchema
const booleanFields = [
  'FEATURE_ENABLED'
] as const;

for (const key of booleanFields) {
  const value = env[key];
  if (value && !isValidBoolean(value)) {
    errors.push(`Type validation failed: ${key}...`);
  }
}

// schema.ts - validEnvArbitrary
FEATURE_ENABLED: fc.option(
  fc.constantFrom('true', 'false'),
  { nil: undefined }
),
```

### Enum variable

```dotenv
# .env.schema
# @type=enum(redis,memcached,none)
CACHE_DRIVER=redis
```

```typescript
// schema.ts - validateSchema
const cacheDriver = env['CACHE_DRIVER'];
if (cacheDriver && !['redis', 'memcached', 'none'].includes(String(cacheDriver))) {
  errors.push(`Type validation failed: CACHE_DRIVER — expected: enum(redis, memcached, none), got: "${cacheDriver}"`);
}

// schema.ts - validEnvArbitrary
CACHE_DRIVER: fc.option(
  fc.constantFrom('redis', 'memcached', 'none'),
  { nil: undefined }
),
```

### Port variable

```dotenv
# .env.schema
# @type=port
REDIS_PORT=6379
```

```typescript
// schema.ts - validateSchema
const portFields = ['ELYOS_PORT', 'SMTP_PORT', 'REDIS_PORT'] as const;

// schema.ts - validEnvArbitrary
REDIS_PORT: fc.option(
  fc.integer({ min: 1, max: 65535 }).map(String),
  { nil: undefined }
),
```

## Conditional Requirements

If a variable is only required when another variable's value meets a condition:

```dotenv
# .env.schema
# @type=enum(redis,memcached,none)
CACHE_DRIVER=redis

# Only required if CACHE_DRIVER=redis
# @required=eq($CACHE_DRIVER, redis)
REDIS_URL=

# @type=port @required=eq($CACHE_DRIVER, redis)
REDIS_PORT=6379
```

Varlock automatically handles conditional requirements, but you can also implement it in `schema.ts` if you prefer.

## Using the Variable in the Application

After adding the variable, you can use it in the application:

```typescript
import { env } from '$lib/env';

// Type-safe access
const redisUrl = env.REDIS_URL;  // string | undefined

if (redisUrl) {
  // Create Redis connection
}
```

## Testing

Run the tests to verify everything works:

```bash
# Unit tests
bun test

# Property-based tests
bun test:pbt
```

## Next Steps

- [Varlock schema format →](/en/environment-schema) — annotations in detail
- [Runtime validation →](/en/environment-runtime) — how schema.ts works
- [Infisical integration →](/en/environment-infisical) — adding secrets
