---
title: Adat validáció
description: Server action input és kliensoldali adat validáció Valibottal – sémák, típuskövetkeztetés és használat
---

A Rocona **Valibot**-ot használ minden server action input és kliensoldali adat validálásához. A Valibot egy könnyűsúlyú, TypeScript-first validációs könyvtár, amely tree-shaking-barát és kiváló típuskövetkeztetést biztosít.

**Hivatalos dokumentáció:** [valibot.dev](https://valibot.dev/)

## Telepítés

A Valibot már része a Rocona függőségeinek:

```typescript
import * as v from 'valibot';
```

## Alapvető sémák

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

## Validátorok láncolása (`v.pipe`)

A `v.pipe` lehetővé teszi több validátor láncolását:

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

## Típuskövetkeztetés

A Valibot automatikusan következteti a TypeScript típusokat a sémából:

```typescript
const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  role: v.picklist(['admin', 'user'])
});

type User = v.InferOutput<typeof userSchema>;
// → { name: string; email: string; role: 'admin' | 'user' }
```

## Szerveroldali használat (server actions)

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

  const task = await db.insert(tasks).values({
    title: input.title,
    priority: input.priority
  });

  return { success: true, task };
});
```

Részletesebben lásd a [Server Actions](/hu/server-actions/) oldalt.

## Kliensoldali használat

Kliensoldali validációhoz használd a `safeParse` függvényt:

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

## `parse` vs `safeParse`

| Függvény | Sikertelen validáció esetén | Visszatérési érték |
|----------|-----------------------------|--------------------|
| `v.parse(schema, data)` | kivételt dob | validált adat |
| `v.safeParse(schema, data)` | nem dob kivételt | `{ success, output, issues }` |

Kliensoldali kódban általában `safeParse` ajánlott, szerveroldalon a `command` wrapper kezeli a validációt automatikusan.

## Egyéni hibaüzenetek

Minden validátorhoz megadhatsz egyéni hibaüzenetet:

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
  ),
  age: v.pipe(
    v.number('Az életkor szám kell legyen'),
    v.integer('Az életkor egész szám kell legyen'),
    v.minValue(18, 'Legalább 18 évesnek kell lenned')
  )
});
```

## Gyakori validációs minták

### Email validáció

```typescript
const emailSchema = v.pipe(
  v.string(),
  v.email('Érvénytelen e-mail cím'),
  v.toLowerCase()
);
```

### Jelszó validáció

```typescript
const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Legalább 8 karakter'),
  v.regex(/[A-Z]/, 'Legalább egy nagybetű szükséges'),
  v.regex(/[a-z]/, 'Legalább egy kisbetű szükséges'),
  v.regex(/[0-9]/, 'Legalább egy szám szükséges')
);
```

### URL validáció

```typescript
const urlSchema = v.pipe(
  v.string(),
  v.url('Érvénytelen URL formátum')
);
```

### Dátum validáció

```typescript
const dateSchema = v.pipe(
  v.string(),
  v.isoDate('Érvénytelen dátum formátum (ISO 8601 szükséges)')
);
```

### Enum validáció

```typescript
const roleSchema = v.picklist(['admin', 'user', 'guest'], 'Érvénytelen szerepkör');
```

## Összetett sémák

### Nested objektumok

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

### Tömbök validációja

```typescript
const tagsSchema = v.pipe(
  v.array(v.string()),
  v.minLength(1, 'Legalább egy tag szükséges'),
  v.maxLength(10, 'Maximum 10 tag engedélyezett')
);

const postSchema = v.object({
  title: v.string(),
  tags: tagsSchema
});
```

### Union típusok

```typescript
const idSchema = v.union([
  v.pipe(v.string(), v.uuid()),
  v.pipe(v.number(), v.integer(), v.minValue(1))
]);
```

## Transzformációk

A Valibot támogatja az adat transzformációját validáció közben:

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

## További információk

- [Valibot hivatalos dokumentáció](https://valibot.dev/)
- [Server Actions](/hu/server-actions/) — server action használat részletesen
- [Env séma validáció](/hu/env-validation/) — környezeti változók validációja Varlock-kal
