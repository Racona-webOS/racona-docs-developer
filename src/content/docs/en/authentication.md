---
title: Authentication
description: better-auth integration, session management, protected routes, 2FA, and authorization
---

## Overview

Racona uses the [better-auth](https://www.better-auth.com/) library for authentication. Supported methods:

- Email + password
- Email OTP (one-time code)
- Google OAuth
- Two-factor authentication (TOTP + backup codes)

## Accessing Session on Server

Session data is accessible through the `locals` object in all server-side code:

```typescript
// In *.remote.ts files
import { command, getRequestEvent } from '$app/server';

export const myAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  // Authenticated user
  const user = locals.user;       // User | null
  const session = locals.session; // Session | null

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  console.log(user.id);    // string
  console.log(user.email); // string
  console.log(user.name);  // string
});
```

### `locals` Types

Interface defined in `app.d.ts`:

```typescript
interface Locals {
  user: import('better-auth').User | null;
  session: import('better-auth').Session | null;
  settings: UserSettings;   // User settings
  locale: string;           // Current language
}
```

## Accessing Session on Client

Session data is loaded from the layout `+layout.server.ts` and accessible via `$page.data`:

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const user = $derived($page.data.user);
</script>

{#if user}
  <p>Welcome, {user.name}!</p>
{/if}
```

## Protected Routes

The `hooks.server.ts` handles authentication and redirects. Protected routes are in the `admin/(protected)/` group — only authenticated users can access them.

If you want custom checks in a route:

```typescript
// +page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, '/admin/login');
  }

  return { user: locals.user };
};
```

## Checking Admin Permission

```typescript
import { command, getRequestEvent } from '$app/server';
import { permissionRepository } from '$lib/server/database/repositories';

export const adminAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  if (!locals.user?.id) {
    return { success: false, error: 'Authentication required' };
  }

  const userId = parseInt(locals.user.id);

  // Check permission
  const hasPermission = await permissionRepository.userHasPermission(
    userId,
    'admin'
  );

  if (!hasPermission) {
    return { success: false, error: 'Permission denied' };
  }

  // ...
});
```

## better-auth Client

Client-side auth operations are available from the `$lib/auth` module:

```typescript
import { authClient } from '$lib/auth';

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await authClient.signOut();

// Change password
await authClient.changePassword({
  currentPassword: 'old',
  newPassword: 'new'
});
```

## Two-Factor Authentication (2FA)

2FA is TOTP-based and can be enabled per user in the Settings application. No server-side configuration is needed — better-auth handles it.

## Server Hook

The `hooks.server.ts` initializes authentication for every request:

```typescript
// hooks.server.ts (excerpt)
import { auth } from '$lib/auth/index';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  // better-auth handles auth routes (/api/auth/*)
  return svelteKitHandler({ event, resolve, auth });
};
```

## Environment Variables

| Variable               | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Token signing secret (`openssl rand -base64 32`)      |
| `BETTER_AUTH_URL`      | Auth callback base URL (must match APP_URL)           |
| `ORIGIN`               | CSRF protection — application's public URL            |
| `REGISTRATION_ENABLED` | Enable registration (`true`/`false`)                  |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                            |

## Single Session Per User

Racona allows only one active session per user. When a new login occurs, the previous session is automatically invalidated.
