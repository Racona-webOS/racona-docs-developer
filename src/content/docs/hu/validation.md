---
title: Validáció
description: Env séma validáció Varlock-kal és adat validáció Valibottal – szerveroldali és kliensoldali használat
---

Az ElyOS két különböző validációs réteget használ:

- **Varlock** — env változók typesafe validációja az alkalmazás indításakor
- **Valibot** — adat validáció server action inputokhoz és kliensoldali űrlapokhoz

---

## Env séma validáció (Varlock)

Az ElyOS **Varlock**-ot használ az összes környezeti változó typesafe validációjához. A Varlock az alkalmazás indításakor fut — a `node server.js` előtt — így a hibás konfiguráció azonnal kiderül.

### Az Env_Schema fájl

Az összes env változó típusa és validációs szabálya az `apps/web/.env.schema` fájlban van definiálva. Ez az egyetlen igazságforrás — a Varlock ebből generálja a TypeScript típusokat is.

```dotenv
# apps/web/.env.schema
# @generateTypes(lang=ts, path=src/env.d.ts)
# @defaultRequired=false

# Bootstrap credentials (kötelező, helyi .env fájlból jön)
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

A `@generateTypes` dekorátor hatására a Varlock automatikusan generál egy `src/env.d.ts` TypeScript típusfájlt — ezt ne szerkeszd kézzel.

### Támogatott típusok és dekorátorok

| Dekorátor / típus                    | Leírás                                              |
| ------------------------------------ | --------------------------------------------------- |
| `@required`                          | Kötelező változó — hiánya leállítja az alkalmazást  |
| `@sensitive`                         | Érzékeny adat — nem kerül naplóba                   |
| `@type=string`                       | Szöveg típus                                        |
| `@type=number` / `@type=port`        | Szám / port típus                                   |
| `@type=boolean`                      | Boolean típus                                       |
| `@type=url`                          | URL validáció                                       |
| `@type=enum(a, b, c)`                | Felsorolt értékek                                   |
| `@type=string(startsWith=prefix_)`   | Prefix validáció (pl. `re_` Resend API kulcshoz)    |
| `@type=number(min=1, max=100)`       | Szám tartomány validáció                            |
| `@type=infisicalClientId`            | Infisical Machine Identity client ID                |
| `@type=infisicalClientSecret`        | Infisical Machine Identity client secret            |

### Env értékek elérése az alkalmazásban

Az `src/lib/env.ts` re-exportálja a Varlock által már validált `process.env` értékeket typesafe módon. Az összes meglévő import változatlan marad:

```typescript
import { env } from '$lib/env';

// Typesafe, a Varlock már validálta indításkor
const dbUrl = env.DATABASE_URL;
const port = env.ELYOS_PORT;
```

### Hibaüzenetek

Ha a validáció sikertelen, a Varlock naplózza a konkrét hibát és leállítja az alkalmazást:

```
[Varlock] HIBA: Hiányzó bootstrap credential: INFISICAL_CLIENT_ID
[Varlock] HIBA: Hiányzó kötelező secret: DATABASE_URL
[Varlock] HIBA: Típusvalidáció sikertelen: SMTP_PORT — elvárt: number, kapott: "invalid"
[Varlock] 42 secret sikeresen betöltve (production/elyos-core)
```

---

## Adat validáció (Valibot)

Az ElyOS **Valibot**-ot használ minden server action input és kliensoldali adat validálásához. A Valibot egy könnyűsúlyú, TypeScript-first validációs könyvtár, amely tree-shaking-barát és kiváló típuskövetkeztetést biztosít.

### Telepítés

A Valibot már része az ElyOS függőségeinek:

```typescript
import * as v from 'valibot';
```

### Alapvető sémák

```typescript
// Primitívek
v.string()
v.number()
v.boolean()

// Módosítók
v.optional(v.string())    // undefined is elfogadott
v.nullable(v.string())    // null is elfogadott
v.nullish(v.string())     // null és undefined is elfogadott

// Összetett típusok
v.array(v.string())
v.object({ name: v.string(), age: v.number() })
v.union([v.string(), v.number()])
v.picklist(['admin', 'user', 'guest'])
```

### Validátorok láncolása (`v.pipe`)

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

### Típuskövetkeztetés

```typescript
const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user'])
});

type User = v.InferOutput<typeof userSchema>;
// → { name: string; email: string; role: 'admin' | 'user' }
```

### Szerveroldali használat (server actions)

A `command` wrapper automatikusan validálja az inputot a megadott séma alapján. Ha a validáció sikertelen, a handler nem fut le.

```typescript
import { command } from '$app/server';
import * as v from 'valibot';

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  priority: v.picklist(['low', 'medium', 'high'])
});

export const createTask = command(schema, async (input) => {
  // input típusa: v.InferOutput<typeof schema>
  // ide csak validált adat jut el
});
```

Részletesebben lásd a [Server Actions](/hu/server-actions/) oldalt.

### Kliensoldali használat

```typescript
import * as v from 'valibot';

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email('Érvénytelen e-mail cím')),
  password: v.pipe(v.string(), v.minLength(8, 'Legalább 8 karakter szükséges'))
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

| Függvény | Sikertelen validáció esetén | Visszatérési érték |
|----------|-----------------------------|--------------------|
| `v.parse(schema, data)` | kivételt dob | validált adat |
| `v.safeParse(schema, data)` | nem dob kivételt | `{ success, output, issues }` |

Kliensoldali kódban általában `safeParse` ajánlott, szerveroldalon a `command` wrapper kezeli a validációt automatikusan.

### Egyéni hibaüzenetek

```typescript
const schema = v.object({
  name: v.pipe(
    v.string('A név szöveg kell legyen'),
    v.minLength(2, 'A név legalább 2 karakter legyen'),
    v.maxLength(100, 'A név legfeljebb 100 karakter lehet')
  ),
  email: v.pipe(
    v.string(),
    v.email('Érvénytelen e-mail cím formátum')
  )
});
```
