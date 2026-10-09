---
title: Runtime Validation
description: The role and operation of schema.ts — runtime validation, property-based testing
---

The `schema.ts` file contains the **runtime validation logic**. While Varlock generates type definitions from the `.env.schema` file, this file validates the loaded values at runtime.

**File:** `apps/web/src/lib/secrets/schema.ts`

## Why is Runtime Validation Needed?

Varlock type generation provides **compile time** safety, but data coming from Infisical or `.env` files is **not type-safe** — anything can be in them.

| Aspect | Varlock (`.env.schema`) | `schema.ts` |
|--------|------------------------|-------------|
| **When it runs** | Build time / at startup | Runtime (after Infisical load) |
| **What it does** | TypeScript type generation | Value validation |
| **Where it's used** | `env.d.ts` generation | `varlock.ts` → `loadSecretsWithFallback` |
| **Format** | Varlock annotations | TypeScript code |

## Main Functions

### 1. validateSchema(env)

Validates the env object against the rules in `.env.schema`:

```typescript
export function validateSchema(env: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];

  // Check required fields
  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      errors.push(`Missing required variable: ${key}`);
    }
  }

  // Type validations
  if (!['development', 'production', 'test'].includes(String(env.NODE_ENV))) {
    errors.push(`Type validation failed: NODE_ENV...`);
  }

  if (errors.length > 0) {
    throw new Error(`[Varlock] Schema validation failed:\n${errors.join('\n')}`);
  }

  return env;
}
```

**Validations:**
- Presence of required fields
- Types (URL, port, boolean, number, enum)
- Ranges (e.g. `DEMO_RESET_HOUR`: 0-23)
- Special formats (e.g. `DATABASE_URL` must start with `postgresql://`)

### 2. Key lists

```typescript
export const REQUIRED_KEYS = [
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
  'NODE_ENV',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL'
] as const;

export const EXPECTED_ENV_KEYS = [
  // All variables, required + optional
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
  'NODE_ENV',
  // ... all others
] as const;
```

### 3. Property-based testing

```typescript
export function validEnvArbitrary(): fc.Arbitrary<Record<string, unknown>>
```

A **fast-check** arbitrary generator that creates random but valid env objects for tests:

```typescript
// In tests:
fc.assert(
  fc.property(validEnvArbitrary(), (env) => {
    expect(() => validateSchema(env)).not.toThrow();
  })
);
```

## Usage in Code

```typescript
// In varlock.ts:
import { validateSchema } from './schema.js';

async function loadSecretsWithFallback(options) {
  const secrets = await fetchWithRetry(infisical);
  const validated = validateSchema(secrets); // ← Runs here
  return { secrets: validated, source: 'infisical' };
}
```

## Validation Examples

### URL validation

```typescript
const urlFields = ['APP_URL', 'ORIGIN', 'BETTER_AUTH_URL'] as const;
for (const key of urlFields) {
  const value = env[key];
  if (value && !isValidUrl(value)) {
    errors.push(`Type validation failed: ${key} — expected: url, got: "${value}"`);
  }
}
```

### Port validation

```typescript
const portFields = ['RACONA_PORT', 'SMTP_PORT', 'POSTGRES_PORT'] as const;
for (const key of portFields) {
  const value = env[key];
  if (value && !isValidPort(value)) {
    errors.push(`Type validation failed: ${key} — expected: port (1–65535), got: "${value}"`);
  }
}
```

### Enum validation

```typescript
const nodeEnv = env['NODE_ENV'];
if (!['development', 'production', 'test'].includes(String(nodeEnv))) {
  errors.push(`Type validation failed: NODE_ENV — expected: enum(development, production, test), got: "${nodeEnv}"`);
}
```

### Range validation

```typescript
const numericRangeFields = [
  { key: 'EMAIL_OTP_EXPIRES_IN', min: 1, max: 20 },
  { key: 'DEMO_RESET_HOUR', min: 0, max: 23 },
  { key: 'VERIFICATION_ROLLOUT_PERCENTAGE', min: 0, max: 100 }
];

for (const { key, min, max } of numericRangeFields) {
  const value = env[key];
  if (value && !isValidNumber(value, min, max)) {
    errors.push(`Type validation failed: ${key} — expected: number(min=${min}, max=${max}), got: "${value}"`);
  }
}
```

## Error Messages

```
[Varlock] Schema validation failed:
  Missing required variable: DATABASE_URL
  Type validation failed: SMTP_PORT — expected: port (1–65535), got: "invalid"
  Type validation failed: NODE_ENV — expected: enum(development, production, test), got: "staging"
```

## Next Steps

- [Adding a new variable →](/en/environment-add-variable) — step-by-step guide
- [Varlock schema format →](/en/environment-schema) — annotations and types
- [Infisical integration →](/en/environment-infisical) — secrets management
