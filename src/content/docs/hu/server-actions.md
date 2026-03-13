---
title: Server Actions (Remote Functions)
description: A command/query minta használata szerver oldali logikához – validáció, session kezelés, hibakezelés
---

## Áttekintés

Az ElyOS a SvelteKit `command` és `query` függvényeit használja szerver oldali logikához. Ezek a `*.remote.ts` fájlokban élnek, és közvetlenül hívhatók a kliens oldalról — nincs szükség külön API route-ra.

```
src/apps/[app-name]/
└── [feature].remote.ts   # Szerver akciók
```

## command vs query

| Típus     | Mikor használd                    | Mutáció? |
| --------- | --------------------------------- | -------- |
| `command` | Adatmódosítás, mentés, törlés     | Igen     |
| `query`   | Adatolvasás, listázás             | Nem      |

:::note
Technikailag mindkettő POST kérést küld, de a `command`/`query` megkülönböztetés szemantikai konvenció, ami segíti az olvashatóságot és a jövőbeli optimalizációkat.
:::

## Alapstruktúra

```typescript
// src/apps/settings/settings.remote.ts
import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';

// Validációs séma
const updateSettingsSchema = v.object({
  theme: v.optional(v.object({
    mode: v.optional(v.picklist(['light', 'dark', 'auto']))
  }))
});

// Mutáció – command
export const updateSettings = command(updateSettingsSchema, async (input) => {
  const { locals } = getRequestEvent();

  if (!locals.user?.id) {
    return { success: false, error: 'Nincs bejelentkezve' };
  }

  // ... adatbázis művelet

  return { success: true };
});

// Olvasás – query
export const getSettings = query(async () => {
  const { locals } = getRequestEvent();
  // ... adatok lekérése
  return { success: true, data: locals.settings };
});
```

## Visszatérési érték konvenció

Minden remote function `{ success: boolean, error?: string, ...data }` alakú objektumot ad vissza:

```typescript
// Sikeres válasz
return { success: true, data: result };

// Hibás válasz
return { success: false, error: 'Leíró hibaüzenet' };
```

## Validáció

A `command` első paramétere mindig egy Valibot séma. Az input automatikusan validálódik — ha a validáció sikertelen, a handler nem fut le.

```typescript
import * as v from 'valibot';

const createUserSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2), v.maxLength(100)),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user']),
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150)))
});

export const createUser = command(createUserSchema, async (input) => {
  // input típusa automatikusan v.InferOutput<typeof createUserSchema>
  console.log(input.name, input.email);
  // ...
});
```

A Valibot részletes dokumentációját — beleértve a kliensoldali használatot, típuskövetkeztetést és egyéni hibaüzeneteket — a [Validáció](/hu/validation/) oldalon találod.

## Session és jogosultság ellenőrzés

A `getRequestEvent()` adja vissza az aktuális request kontextust, benne a `locals`-szal:

```typescript
import { command, getRequestEvent } from '$app/server';

export const deleteItem = command(deleteSchema, async (input) => {
  const { locals } = getRequestEvent();

  // Autentikáció ellenőrzése
  if (!locals.user?.id) {
    return { success: false, error: 'Hitelesítés szükséges' };
  }

  // Admin jogosultság ellenőrzése
  // (a jogosultságkezelés a permissionStore-on keresztül történik)
  const userId = parseInt(locals.user.id);

  // ...
});
```

### `locals` tartalma

Az `app.d.ts`-ben definiált `App.Locals` interfész:

```typescript
interface Locals {
  user: import('better-auth').User | null;
  session: import('better-auth').Session | null;
  settings: UserSettings;
  locale: string;
}
```

## Kliens oldali hívás

A remote functionök közvetlenül importálhatók és hívhatók a Svelte komponensekből:

```svelte
<script lang="ts">
  import { updateSettings } from './settings.remote';
  import { toast } from 'svelte-sonner';

  async function save() {
    const result = await updateSettings({ theme: { mode: 'dark' } });

    if (result.success) {
      toast.success('Beállítások mentve');
    } else {
      toast.error(result.error ?? 'Hiba történt');
    }
  }
</script>

<button onclick={save}>Mentés</button>
```

## Timeout kezelés

Ha a szerver nem válaszol, a `withTimeout` segédfüggvény megakadályozza a UI lefagyását:

```typescript
import { withTimeout, RemoteTimeoutError } from '$lib/utils/remote';

try {
  const result = await withTimeout(fetchData({}), 8000);
} catch (error) {
  if (error instanceof RemoteTimeoutError) {
    toast.error('A szerver nem válaszolt időben');
  }
}
```

## Paginált lekérdezések

Paginált adatok visszaadásának konvenciója:

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

## Típus exportálás

A séma output típusát érdemes exportálni a kliens oldali használathoz:

```typescript
export type CreateUserInput = v.InferOutput<typeof createUserSchema>;
```
