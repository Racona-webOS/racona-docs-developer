---
title: Data Validation
description: Server action input and client-side data validation with Valibot – schemas, type inference, and usage
---

Racona uses **Valibot** for validating all server action inputs and client-side data. Valibot is a lightweight, TypeScript-first validation library that's tree-shaking-friendly and provides excellent type inference.

**Official documentation:** [valibot.dev](https://valibot.dev/)

## Installation

Valibot is already part of Racona dependencies:

```typescript
import * as v from 'valibot';
```

## Basic Schemas

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

## Chaining Validators (`v.pipe`)

The `v.pipe` function allows chaining multiple validators:

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

## Type Inference

Valibot automatically infers TypeScript types from schemas:

```typescript
const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user'])
});

type User = v.InferOutput<typeof userSchema>;
// → { name: string; email: string; role: 'admin' | 'user' }
```

## Server-Side Usage (Server Actions)

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

  const task = await db.insert(tasks).values({
    title: input.title,
    priority: input.priority
  });

  return { success: true, task };
});
```

See [Server Actions](/en/server-actions/) for more details.

## Client-Side Usage

For client-side validation, use the `safeParse` function:

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

## `parse` vs `safeParse`

| Function | On Validation Failure | Return Value |
|----------|----------------------|--------------|
| `v.parse(schema, data)` | Throws exception | validated data |
| `v.safeParse(schema, data)` | Doesn't throw | `{ success, output, issues }` |

On the client side, `safeParse` is generally recommended; on the server, the `command` wrapper handles validation automatically.

## Custom Error Messages

You can provide custom error messages for every validator:

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
  ),
  age: v.pipe(
    v.number('Age must be a number'),
    v.integer('Age must be an integer'),
    v.minValue(18, 'Must be at least 18 years old')
  )
});
```

## Common Validation Patterns

### Email Validation

```typescript
const emailSchema = v.pipe(
  v.string(),
  v.email('Invalid email address'),
  v.toLowerCase()
);
```

### Password Validation

```typescript
const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'At least 8 characters'),
  v.regex(/[A-Z]/, 'At least one uppercase letter required'),
  v.regex(/[a-z]/, 'At least one lowercase letter required'),
  v.regex(/[0-9]/, 'At least one number required')
);
```

### URL Validation

```typescript
const urlSchema = v.pipe(
  v.string(),
  v.url('Invalid URL format')
);
```

### Date Validation

```typescript
const dateSchema = v.pipe(
  v.string(),
  v.isoDate('Invalid date format (ISO 8601 required)')
);
```

### Enum Validation

```typescript
const roleSchema = v.picklist(['admin', 'user', 'guest'], 'Invalid role');
```

## Complex Schemas

### Nested Objects

```typescript
const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zipCode: v.pipe(v.string(), v.regex(/^\d{4}$/))
});

const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  address: addressSchema
});
```

### Array Validation

```typescript
const tagsSchema = v.pipe(
  v.array(v.string()),
  v.minLength(1, 'At least one tag required'),
  v.maxLength(10, 'Maximum 10 tags allowed')
);

const postSchema = v.object({
  title: v.string(),
  tags: tagsSchema
});
```

### Union Types

```typescript
const idSchema = v.union([
  v.pipe(v.string(), v.uuid()),
  v.pipe(v.number(), v.integer(), v.minValue(1))
]);
```

## Transformations

Valibot supports data transformation during validation:

```typescript
const trimmedString = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1)
);

const normalizedEmail = v.pipe(
  v.string(),
  v.email(),
  v.toLowerCase()
);

const parsedNumber = v.pipe(
  v.string(),
  v.transform(s => parseInt(s, 10)),
  v.number(),
  v.minValue(0)
);
```

## Further Information

- [Valibot Official Documentation](https://valibot.dev/)
- [Server Actions](/en/server-actions/) — detailed server action usage
- [Environment Validation](/en/env-validation/) — environment variable validation with Varlock
