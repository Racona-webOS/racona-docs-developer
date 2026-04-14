---
title: Autentikáció
description: better-auth integráció, session kezelés, védett route-ok, 2FA és jogosultságkezelés
---

## Áttekintés

A Rocona a [better-auth](https://www.better-auth.com/) könyvtárat használja autentikációhoz. Támogatott módszerek:

- Email + jelszó
- Email OTP (egyszeri kód)
- Google OAuth
- Kétfaktoros hitelesítés (TOTP + backup kódok)

## Session elérése szerver oldalon

A session adatok a `locals` objektumon keresztül érhetők el minden szerver oldali kódban:

```typescript
// *.remote.ts fájlban
import { command, getRequestEvent } from '$app/server';

export const myAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  // Bejelentkezett felhasználó
  const user = locals.user;       // User | null
  const session = locals.session; // Session | null

  if (!user) {
    return { success: false, error: 'Hitelesítés szükséges' };
  }

  console.log(user.id);    // string
  console.log(user.email); // string
  console.log(user.name);  // string
});
```

### `locals` típusok

Az `app.d.ts`-ben definiált interfész:

```typescript
interface Locals {
  user: import('better-auth').User | null;
  session: import('better-auth').Session | null;
  settings: UserSettings;   // Felhasználói beállítások
  locale: string;           // Aktuális nyelv
}
```

## Session elérése kliens oldalon

A session adatok a layout `+layout.server.ts`-ből töltődnek be és a `$page.data`-n keresztül érhetők el:

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const user = $derived($page.data.user);
</script>

{#if user}
  <p>Üdv, {user.name}!</p>
{/if}
```

## Védett route-ok

A `hooks.server.ts` kezeli az autentikációt és az átirányításokat. A védett útvonalak az `admin/(protected)/` csoportban vannak — ezekre csak bejelentkezett felhasználók léphetnek be.

Ha saját ellenőrzést szeretnél egy route-ban:

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

## Admin jogosultság ellenőrzése

```typescript
import { command, getRequestEvent } from '$app/server';
import { permissionRepository } from '$lib/server/database/repositories';

export const adminAction = command(schema, async (input) => {
  const { locals } = getRequestEvent();

  if (!locals.user?.id) {
    return { success: false, error: 'Hitelesítés szükséges' };
  }

  const userId = parseInt(locals.user.id);

  // Jogosultság ellenőrzése
  const hasPermission = await permissionRepository.userHasPermission(
    userId,
    'admin'
  );

  if (!hasPermission) {
    return { success: false, error: 'Nincs jogosultság' };
  }

  // ...
});
```

## better-auth kliens

A kliens oldali auth műveletek a `$lib/auth` modulból érhetők el:

```typescript
import { authClient } from '$lib/auth';

// Bejelentkezés
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'jelszó'
});

// Kijelentkezés
await authClient.signOut();

// Jelszó módosítás
await authClient.changePassword({
  currentPassword: 'régi',
  newPassword: 'új'
});
```

## Kétfaktoros hitelesítés (2FA)

A 2FA TOTP alapú, felhasználónként a Beállítások alkalmazásban kapcsolható be. Nincs szükség szerver oldali konfigurációra — a better-auth kezeli.

## Szerver hook

A `hooks.server.ts` inicializálja az autentikációt minden kérésnél:

```typescript
// hooks.server.ts (részlet)
import { auth } from '$lib/auth/index';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  // better-auth kezeli az auth route-okat (/api/auth/*)
  return svelteKitHandler({ event, resolve, auth });
};
```

## Környezeti változók

| Változó                | Leírás                                                    |
| ---------------------- | --------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Token aláíró titok (`openssl rand -base64 32`)            |
| `BETTER_AUTH_URL`      | Auth callback alap URL (meg kell egyeznie az APP_URL-lel) |
| `ORIGIN`               | CSRF védelem — az alkalmazás publikus URL-je              |
| `REGISTRATION_ENABLED` | Regisztráció engedélyezése (`true`/`false`)               |
| `GOOGLE_CLIENT_ID`     | Google OAuth kliens azonosító                             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth kliens titok                                 |

## Egyszeri munkamenet

A Rocona felhasználónként csak egy aktív munkamenetet engedélyez. Új bejelentkezéskor a korábbi munkamenet automatikusan érvénytelenítődik.
