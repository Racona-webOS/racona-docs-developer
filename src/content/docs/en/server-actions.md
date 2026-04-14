---
title: Server Actions (Remote Functions)
description: Using the command/query pattern for server-side logic – validation, session management, error handling
---

## Overview

Racona uses SvelteKit's `command` and `query` functions for server-side logic. These live in `*.remote.ts` files and can be called directly from the client — no need for separate API routes.

```
src/apps/[app-name]/
└── [feature].remote.ts   # Server actions
```

## command vs query

| Type      | When to Use                       | Mutation? |
| --------- | --------------------------------- | --------- |
| `command` | Data modification, save, delete   | Yes       |
| `query`   | Data reading, listing             | No        |

:::note
Technically both send POST requests, but the `command`/`query` distinction is a semantic convention that helps readability and future optimizations.
:::

## Basic Structure

```typescript
// src/apps/settings/settings.remote.ts
import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';

// Validation schema
const updateSettingsSchema = v.object({
  theme: v.optional(v.object({
    mode: v.optional(v.picklist(['light', 'dark', 'auto']))
  }))
});

// Mutation – command
export const updateSettings = command(updateSettingsSchema, async (input) => {
  const { locals } = getRequestEvent();

  if (!locals.user?.id) {
    return { success: false, error: 'Not logged in' };
  }

  // ... database operation

  return { success: true };
});

// Reading – query
export const getSettings = query(async () => {
  const { locals } = getRequestEvent();
  // ... fetch data
  return { success: true, data: locals.settings };
});
```

## Return Value Convention

Every remote function returns an object of shape `{ success: boolean, error?: string, ...data }`:

```typescript
// Successful response
return { success: true, data: result };

// Error response
return { success: false, error: 'Descriptive error message' };
```

## Validation

The first parameter of `command` is always a Valibot schema. Input is automatically validated — if validation fails, the handler doesn't run.

```typescript
import * as v from 'valibot';

const createUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user']),
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150)))
});

export const createUser = command(createUserSchema, async (input) => {
  // input type is automatically v.InferOutput<typeof createUserSchema>
  console.log(input.name, input.email);
  // ...
});
```

Detailed Valibot documentation — including client-side usage, type inference, and custom error messages — can be found on the [Validation](/en/validation/) page.

## Session and Permission Checking

`getRequestEvent()` returns the current request context, including `locals`:

```typescript
import { command, getRequestEvent } from '$app/server';

export const deleteItem = command(deleteSchema, async (input) => {
  const { locals } = getRequestEvent();

  // Check authentication
  if (!locals.user?.id) {
    return { success: false, error: 'Authentication required' };
  }

  // Check admin permission
  // (permission management is done via permissionStore)
  const userId = parseInt(locals.user.id);

  // ...
});
```

### `locals` Contents

The `App.Locals` interface defined in `app.d.ts`:

```typescript
interface Locals {
  user: import('better-auth').User | null;
  session: import('better-auth').Session | null;
  settings: UserSettings;
  locale: string;
}
```

## Client-Side Call

Remote functions can be imported and called directly from Svelte components:

```svelte
<script lang="ts">
  import { updateSettings } from './settings.remote';
  import { toast } from 'svelte-sonner';

  async function save() {
    const result = await updateSettings({ theme: { mode: 'dark' } });

    if (result.success) {
      toast.success('Settings saved');
    } else {
      toast.error(result.error ?? 'An error occurred');
    }
  }
</script>

<button onclick={save}>Save</button>
```

## Timeout Handling

If the server doesn't respond, the `withTimeout` helper prevents UI freezing:

```typescript
import { withTimeout, RemoteTimeoutError } from '$lib/utils/remote';

try {
  const result = await withTimeout(fetchData({}), 8000);
} catch (error) {
  if (error instanceof RemoteTimeoutError) {
    toast.error('Server did not respond in time');
  }
}
```

## Paginated Queries

Convention for returning paginated data:

```typescript
const fetchItemsSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  search: v.optional(v.string())
});

export const fetchItems = command(fetchItemsSchema, async (input) => {
  const limit = input.pageSize ?? 20;
  const offset = ((input.page ?? 1) - 1) * limit;

  const [rows, totalCount] = await Promise.all([
    itemRepository.findMany({ limit, offset, search: input.search }),
    itemRepository.count({ search: input.search })
  ]);

  return {
    success: true,
    data: rows,
    pagination: {
      page: input.page ?? 1,
      pageSize: limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
});
```

## Type Exporting

It's useful to export the schema output type for client-side use:

```typescript
export type CreateUserInput = v.InferOutput<typeof createUserSchema>;
```
