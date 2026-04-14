---
title: Validation
description: Environment schema validation with Varlock and data validation with Valibot – server-side and client-side usage
---

Racona uses two different validation layers:

- **Varlock** — typesafe validation of environment variables at application startup
- **Valibot** — data validation for server action inputs and client-side forms

---

## Environment Schema Validation (Varlock)

Racona uses **Varlock** for typesafe validation of all environment variables. Varlock runs at application startup — before `node server.js` — so configuration errors are caught immediately.

### The Env_Schema File

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

### Supported Types and Decorators

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

### Accessing Environment Values in Application

The `src/lib/env.ts` re-exports Varlock-validated `process.env` values in a typesafe way. All existing imports remain unchanged:

```typescript
import { env } from '$lib/env';

// Typesafe, already validated by Varlock at startup
const dbUrl = env.DATABASE_URL;
const port = env.ELYOS_PORT;
```

### Error Messages

If validation fails, Varlock logs the specific error and stops the application:

```
[Varlock] ERROR: Missing bootstrap credential: INFISICAL_CLIENT_ID
[Varlock] ERROR: Missing required secret: DATABASE_URL
[Varlock] ERROR: Type validation failed: SMTP_PORT — expected: number, got: "invalid"
[Varlock] 42 secrets loaded successfully (production/elyos-core)
```

---

## Data Validation (Valibot)

Racona uses **Valibot** for validating all server action inputs and client-side data. Valibot is a lightweight, TypeScript-first validation library that's tree-shaking-friendly and provides excellent type inference.

### Installation

Valibot is already part of Racona dependencies:

```typescript
import * as v from 'valibot';
```

### Basic Schemas

```typescript
// Primitives
v.string()
v.number()
v.boolean()

// Modifiers
v.optional(v.string())    // undefined is accepted
v.nullable(v.string())    // null is accepted
v.nullish(v.string())     // null and undefined are accepted

// Complex types
v.array(v.string())
v.object({ name: v.string(), age: v.number() })
v.union([v.string(), v.number()])
v.picklist(['admin', 'user', 'guest'])
```

### Chaining Validators (`v.pipe`)

```typescript
const nameSchema = v.pipe(
  v.string(),
  v.minLength(2),
  v.maxLength(100),
  v.trim()
);

const emailSchema = v.pipe(v.string(), v.email());
const positiveInt = v.pipe(v.number(), v.integer(), v.minValue(1));
```

### Type Inference

```typescript
const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user'])
});

type User = v.InferOutput<typeof userSchema>;
// → { name: string; email: string; role: 'admin' | 'user' }
```

### Server-Side Usage (Server Actions)

The `command` wrapper automatically validates input against the provided schema. If validation fails, the handler doesn't run.

```typescript
import { command } from '$app/server';
import * as v from 'valibot';

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  priority: v.picklist(['low', 'medium', 'high'])
});

export const createTask = command(schema, async (input) => {
  // input type: v.InferOutput<typeof schema>
  // only validated data reaches here
});
```

See [Server Actions](/en/server-actions/) for more details.

### Client-Side Usage

```typescript
import * as v from 'valibot';

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email address')),
  password: v.pipe(v.string(), v.minLength(8, 'At least 8 characters required'))
});

function validateLogin(data: unknown) {
  const result = v.safeParse(loginSchema, data);

  if (!result.success) {
    const errors = result.issues.map(i => i.message);
    return { valid: false, errors };
  }

  return { valid: true, data: result.output };
}
```

### `parse` vs `safeParse`

| Function | On Validation Failure | Return Value |
|----------|----------------------|--------------|
| `v.parse(schema, data)` | Throws exception | validated data |
| `v.safeParse(schema, data)` | Doesn't throw | `{ success, output, issues }` |

On the client side, `safeParse` is generally recommended; on the server, the `command` wrapper handles validation automatically.

### Custom Error Messages

```typescript
const schema = v.object({
  name: v.pipe(
    v.string('Name must be text'),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(100, 'Name can be at most 100 characters')
  ),
  email: v.pipe(
    v.string(),
    v.email('Invalid email address format')
  )
});
```
