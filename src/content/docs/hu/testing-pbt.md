---
title: Property-based Tesztek
description: Property-based tesztelés fast-check-kel az ElyOS projektben
---

A property-based testing (PBT) egy tesztelési módszer, ahol nem konkrét példákat írunk, hanem általános tulajdonságokat (invariánsokat) definiálunk, amelyeknek mindig igaznak kell lenniük.

## Mi az a Property-based Testing?

Hagyományos unit teszt:
```typescript
it('összeadás kommutativ', () => {
  expect(add(2, 3)).toBe(add(3, 2));
  expect(add(5, 7)).toBe(add(7, 5));
  expect(add(10, 20)).toBe(add(20, 10));
});
```

Property-based teszt:
```typescript
it('Property: összeadás kommutativ', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      return add(a, b) === add(b, a);
    })
  );
});
```

A fast-check automatikusan generál **100 véletlenszerű tesztesetet**, beleértve az edge case-eket is.

## Telepítés és futtatás

```bash
# Telepítés (már telepítve van)
bun add -d fast-check

# Property-based tesztek futtatása
cd apps/web && bun test:pbt

# Vagy név alapján
cd apps/web && bun test --testNamePattern="Property"
```

## Alapvető használat

### Egyszerű property

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('String utils', () => {
  it('Property: reverse kétszer visszaadja az eredeti stringet', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return reverse(reverse(str)) === str;
      })
    );
  });

  it('Property: uppercase nem változtatja meg a hosszt', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return str.toUpperCase().length === str.length;
      })
    );
  });
});
```

## Arbitrary-k (Generátorok)

A fast-check számos beépített generátort kínál:

### Primitív típusok

```typescript
fc.boolean()                    // true | false
fc.integer()                    // Egész szám
fc.integer({ min: 0, max: 100 }) // 0-100 közötti szám
fc.float()                      // Lebegőpontos szám
fc.double()                     // Double precision szám
fc.string()                     // Tetszőleges string
fc.string({ minLength: 5 })     // Min 5 karakter
fc.char()                       // Egyetlen karakter
fc.hexaString()                 // Hexadecimális string
fc.uuid()                       // UUID v4
```

### Összetett típusok

```typescript
fc.array(fc.integer())          // Egész számok tömbje
fc.array(fc.string(), { minLength: 1, maxLength: 10 })
fc.record({                     // Objektum
  id: fc.integer(),
  name: fc.string(),
  email: fc.emailAddress()
})
fc.tuple(fc.string(), fc.integer()) // [string, number]
fc.oneof(fc.string(), fc.integer()) // string | number
fc.option(fc.string())          // string | null
```

### Dátumok és időpontok

```typescript
fc.date()                       // Tetszőleges dátum
fc.date({ min: new Date('2024-01-01') })
fc.date({ max: new Date() })    // Múltbeli dátum
```

### Egyedi generátorok

```typescript
// Email cím
fc.emailAddress()

// Domain név
fc.domain()

// URL
fc.webUrl()

// IP cím
fc.ipV4()
fc.ipV6()

// JSON érték
fc.json()
```

## Gyakorlati példák

### Pagination logika

```typescript
describe('Pagination', () => {
  it('Property: az összes elem megjelenik pontosan egyszer', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (items, pageSize) => {
          const pages = paginate(items, pageSize);
          const allItems = pages.flat();

          // Minden elem pontosan egyszer szerepel
          return allItems.length === items.length &&
                 allItems.every((item, i) => item === items[i]);
        }
      )
    );
  });

  it('Property: az utolsó oldal kivételével minden oldal tele van', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1 }),
        fc.integer({ min: 1, max: 20 }),
        (items, pageSize) => {
          const pages = paginate(items, pageSize);

          // Az utolsó oldal kivételével minden oldal pageSize méretű
          return pages.slice(0, -1).every(page => page.length === pageSize);
        }
      )
    );
  });
});
```

### Validációs logika

```typescript
describe('Email validation', () => {
  it('Property: valid email mindig átmegy a validáción', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        return validateEmail(email).valid === true;
      })
    );
  });

  it('Property: email nélkül @ karakter invalid', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (invalidEmail) => {
          return validateEmail(invalidEmail).valid === false;
        }
      )
    );
  });
});
```

### Matematikai tulajdonságok

```typescript
describe('Math utils', () => {
  it('Property: összeadás kommutativ', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return add(a, b) === add(b, a);
      })
    );
  });

  it('Property: összeadás asszociatív', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
        return add(add(a, b), c) === add(a, add(b, c));
      })
    );
  });

  it('Property: szorzás disztributív', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
        return multiply(a, add(b, c)) === add(multiply(a, b), multiply(a, c));
      })
    );
  });

  it('Property: abszolút érték mindig nem-negatív', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return Math.abs(n) >= 0;
      })
    );
  });
});
```

### Adatstruktúra invariánsok

```typescript
describe('Stack', () => {
  it('Property: push után pop visszaadja az elemet', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.integer(),
        (initialItems, newItem) => {
          const stack = new Stack(initialItems);
          stack.push(newItem);
          return stack.pop() === newItem;
        }
      )
    );
  });

  it('Property: size mindig egyezik az elemek számával', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (items) => {
        const stack = new Stack(items);
        return stack.size() === items.length;
      })
    );
  });
});
```

### String manipuláció

```typescript
describe('String utils', () => {
  it('Property: trim nem változtatja meg a nem-whitespace karaktereket', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const trimmed = str.trim();
        const original = str.replace(/^\s+|\s+$/g, '');
        return trimmed === original;
      })
    );
  });

  it('Property: split és join visszaadja az eredeti stringet', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string({ minLength: 1 }),
        (str, separator) => {
          // Ha a separator nem szerepel a stringben
          if (!str.includes(separator)) {
            return str.split(separator).join(separator) === str;
          }
          return true;
        }
      )
    );
  });
});
```

## Egyedi arbitrary létrehozása

```typescript
// Felhasználó generátor
const userArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  age: fc.integer({ min: 18, max: 120 }),
  role: fc.constantFrom('user', 'admin', 'moderator'),
  createdAt: fc.date({ max: new Date() })
});

describe('User service', () => {
  it('Property: minden valid user menthető', () => {
    fc.assert(
      fc.property(userArbitrary, async (user) => {
        const result = await saveUser(user);
        return result.success === true;
      })
    );
  });
});
```

## Shrinking (Minimalizálás)

Ha a fast-check talál egy hibát, automatikusan megpróbálja minimalizálni a tesztesetet:

```typescript
// Eredeti hiba: n = 847362
// Shrinking után: n = 0

it('Property: példa shrinking-re', () => {
  fc.assert(
    fc.property(fc.integer(), (n) => {
      return n !== 0; // Ez el fog bukni
    })
  );
});

// Output:
// Property failed after 1 tests
// { seed: 123456, path: "0:0", endOnFailure: true }
// Counterexample: [0]
// Shrunk 15 time(s)
// Got error: Property failed by returning false
```

## Konfigurációs opciók

```typescript
fc.assert(
  fc.property(fc.integer(), (n) => {
    return n >= 0;
  }),
  {
    numRuns: 1000,        // Tesztesetek száma (alapértelmezett: 100)
    seed: 42,             // Fix seed reprodukálható tesztekhez
    verbose: true,        // Részletes kimenet
    endOnFailure: true    // Megáll az első hiba után
  }
);
```

## Mikor használd a PBT-t?

### Jó használati esetek

- **Matematikai függvények:** Kommutativitás, asszociativitás, disztributivitás
- **Adatstruktúrák:** Invariánsok (pl. heap property, BST property)
- **Kódolás/dekódolás:** encode(decode(x)) === x
- **Szerializáció:** parse(stringify(x)) === x
- **Validáció:** Minden valid input átmegy, minden invalid elutasításra kerül
- **Pagination/sorting:** Elemek megmaradnak, sorrend helyes

### Kevésbé alkalmas esetek

- **UI interakciók:** Túl sok állapot, nehéz property-ket definiálni
- **Külső API-k:** Nem determinisztikus viselkedés
- **Időfüggő logika:** Nehéz reprodukálni
- **Komplex üzleti logika:** Konkrét példák érthetőbbek

## Best practice-ek

1. **Egyszerű property-k:** Kezdd egyszerű tulajdonságokkal
2. **Kombináld unit tesztekkel:** PBT kiegészíti, nem helyettesíti a unit teszteket
3. **Dokumentáció:** A property-k dokumentálják a kód viselkedését
4. **Seed mentése:** Hiba esetén mentsd el a seed-et reprodukáláshoz
5. **Precondition-ök:** Használj `fc.pre()` vagy `.filter()` az érvényes inputokhoz
6. **Timeout:** Állíts be timeout-ot lassú property-khez

## Hibakeresés

```typescript
it('Property: debug példa', () => {
  fc.assert(
    fc.property(fc.integer(), (n) => {
      // Logolás
      console.log('Testing with:', n);

      // Precondition
      fc.pre(n >= 0);

      // Teszt
      return someFunction(n) > 0;
    }),
    {
      verbose: true,  // Részletes kimenet
      seed: 42        // Reprodukálható teszt
    }
  );
});
```

## Következő lépések

- [Vitest unit tesztek →](/hu/testing-vitest)
- [E2E tesztek →](/hu/testing-e2e)
- [Tesztelés áttekintés →](/hu/testing)
- [fast-check dokumentáció ↗](https://fast-check.dev/)
