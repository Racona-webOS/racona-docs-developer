---
title: Property-based Tests
description: Property-based testing with fast-check in the Racona project
---

Property-based testing (PBT) is a testing method where instead of writing concrete examples, you define general properties (invariants) that must always hold true.

## What is Property-based Testing?

Traditional unit test:
```typescript
it('addition is commutative', () => {
  expect(add(2, 3)).toBe(add(3, 2));
  expect(add(5, 7)).toBe(add(7, 5));
  expect(add(10, 20)).toBe(add(20, 10));
});
```

Property-based test:
```typescript
it('Property: addition is commutative', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      return add(a, b) === add(b, a);
    })
  );
});
```

fast-check automatically generates **100 random test cases**, including edge cases.

## Installation and running

```bash
# Install (already installed)
bun add -d fast-check

# Run property-based tests
cd apps/web && bun test:pbt

# Or by name
cd apps/web && bun test --testNamePattern="Property"
```

## Basic usage

### Simple property

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('String utils', () => {
  it('Property: reversing twice returns the original string', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return reverse(reverse(str)) === str;
      })
    );
  });

  it('Property: uppercase does not change the length', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return str.toUpperCase().length === str.length;
      })
    );
  });
});
```

## Arbitraries (Generators)

fast-check provides many built-in generators:

### Primitive types

```typescript
fc.boolean()                    // true | false
fc.integer()                    // Integer
fc.integer({ min: 0, max: 100 }) // Number between 0-100
fc.float()                      // Floating point number
fc.double()                     // Double precision number
fc.string()                     // Arbitrary string
fc.string({ minLength: 5 })     // Min 5 characters
fc.char()                       // Single character
fc.hexaString()                 // Hexadecimal string
fc.uuid()                       // UUID v4
```

### Complex types

```typescript
fc.array(fc.integer())          // Array of integers
fc.array(fc.string(), { minLength: 1, maxLength: 10 })
fc.record({                     // Object
  id: fc.integer(),
  name: fc.string(),
  email: fc.emailAddress()
})
fc.tuple(fc.string(), fc.integer()) // [string, number]
fc.oneof(fc.string(), fc.integer()) // string | number
fc.option(fc.string())          // string | null
```

### Dates and times

```typescript
fc.date()                       // Arbitrary date
fc.date({ min: new Date('2024-01-01') })
fc.date({ max: new Date() })    // Past date
```

### Special generators

```typescript
fc.emailAddress()
fc.domain()
fc.webUrl()
fc.ipV4()
fc.ipV6()
fc.json()
```

## Practical examples

### Pagination logic

```typescript
describe('Pagination', () => {
  it('Property: all items appear exactly once', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (items, pageSize) => {
          const pages = paginate(items, pageSize);
          const allItems = pages.flat();

          return allItems.length === items.length &&
                 allItems.every((item, i) => item === items[i]);
        }
      )
    );
  });

  it('Property: all pages except the last are full', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1 }),
        fc.integer({ min: 1, max: 20 }),
        (items, pageSize) => {
          const pages = paginate(items, pageSize);
          return pages.slice(0, -1).every(page => page.length === pageSize);
        }
      )
    );
  });
});
```

### Validation logic

```typescript
describe('Email validation', () => {
  it('Property: valid email always passes validation', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        return validateEmail(email).valid === true;
      })
    );
  });

  it('Property: email without @ is invalid', () => {
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

### Mathematical properties

```typescript
describe('Math utils', () => {
  it('Property: addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return add(a, b) === add(b, a);
      })
    );
  });

  it('Property: addition is associative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
        return add(add(a, b), c) === add(a, add(b, c));
      })
    );
  });

  it('Property: multiplication is distributive', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
        return multiply(a, add(b, c)) === add(multiply(a, b), multiply(a, c));
      })
    );
  });

  it('Property: absolute value is always non-negative', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return Math.abs(n) >= 0;
      })
    );
  });
});
```

### Data structure invariants

```typescript
describe('Stack', () => {
  it('Property: pop after push returns the element', () => {
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

  it('Property: size always matches the number of elements', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (items) => {
        const stack = new Stack(items);
        return stack.size() === items.length;
      })
    );
  });
});
```

## Custom arbitrary creation

```typescript
// User generator
const userArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  age: fc.integer({ min: 18, max: 120 }),
  role: fc.constantFrom('user', 'admin', 'moderator'),
  createdAt: fc.date({ max: new Date() })
});

describe('User service', () => {
  it('Property: every valid user can be saved', () => {
    fc.assert(
      fc.property(userArbitrary, async (user) => {
        const result = await saveUser(user);
        return result.success === true;
      })
    );
  });
});
```

## Shrinking (Minimization)

When fast-check finds a failure, it automatically tries to minimize the test case:

```typescript
// Original failure: n = 847362
// After shrinking: n = 0

it('Property: shrinking example', () => {
  fc.assert(
    fc.property(fc.integer(), (n) => {
      return n !== 0; // This will fail
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

## Configuration options

```typescript
fc.assert(
  fc.property(fc.integer(), (n) => {
    return n >= 0;
  }),
  {
    numRuns: 1000,        // Number of test cases (default: 100)
    seed: 42,             // Fixed seed for reproducible tests
    verbose: true,        // Detailed output
    endOnFailure: true    // Stop on first failure
  }
);
```

## When to use PBT?

### Good use cases

- **Mathematical functions:** Commutativity, associativity, distributivity
- **Data structures:** Invariants (e.g., heap property, BST property)
- **Encoding/decoding:** encode(decode(x)) === x
- **Serialization:** parse(stringify(x)) === x
- **Validation:** All valid inputs pass, all invalid are rejected
- **Pagination/sorting:** Elements are preserved, order is correct

### Less suitable cases

- **UI interactions:** Too much state, hard to define properties
- **External APIs:** Non-deterministic behavior
- **Time-dependent logic:** Hard to reproduce
- **Complex business logic:** Concrete examples are more readable

## Best practices

1. **Simple properties:** Start with simple properties
2. **Combine with unit tests:** PBT complements, not replaces unit tests
3. **Documentation:** Properties document the code's behavior
4. **Save seeds:** Save the seed when a failure occurs for reproduction
5. **Preconditions:** Use `fc.pre()` or `.filter()` for valid inputs
6. **Timeout:** Set a timeout for slow properties

## Debugging

```typescript
it('Property: debug example', () => {
  fc.assert(
    fc.property(fc.integer(), (n) => {
      // Logging
      console.log('Testing with:', n);

      // Precondition
      fc.pre(n >= 0);

      // Test
      return someFunction(n) > 0;
    }),
    {
      verbose: true,  // Detailed output
      seed: 42        // Reproducible test
    }
  );
});
```

## Next steps

- [Vitest unit tests →](/en/testing-vitest)
- [E2E tests →](/en/testing-e2e)
- [Testing overview →](/en/testing)
- [fast-check documentation ↗](https://fast-check.dev/)
