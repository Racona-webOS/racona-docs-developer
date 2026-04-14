---
title: Testing
description: Testing strategy and tools in the Racona project
---

Racona uses three testing layers to ensure code quality.

## Testing Layers

| Tool              | Type                    | Run command           | Documentation |
| ------------------- | ------------------------ | --------------------- | ------------ |
| **Vitest**          | Unit tests               | `bun test`            | [Vitest →](/en/testing-vitest) |
| **fast-check**      | Property-based tests     | `bun test:pbt`        | [Property-based →](/en/testing-pbt) |
| **Playwright**      | E2E tests                | `bunx playwright test`| [E2E →](/en/testing-e2e) |

**Important:** Tests must be run from the `apps/web` directory.

## When to Use Which?

### Vitest (Unit Tests)

**Purpose:** Testing individual functions, classes, and components in isolation.

**Examples:**
- Utility functions (formatting, validation, calculations)
- Store state management
- Server action logic
- Database repository functions

**Advantages:**
- Fast execution
- Simple debugging
- Precise error reporting

[Details →](/en/testing-vitest)

---

### fast-check (Property-based Tests)

**Purpose:** Checking invariants with random inputs.

**Examples:**
- Mathematical properties (commutative, associative)
- Data structure invariants
- Validation logic
- Pagination calculations

**Advantages:**
- Automatic testing of many edge cases
- Discovering hidden bugs
- Documenting specifications

[Details →](/en/testing-pbt)

---

### Playwright (E2E Tests)

**Purpose:** Testing complete user flows in a browser.

**Examples:**
- Login flow
- Opening and using applications
- Form filling and saving
- Navigation and routing

**Advantages:**
- Testing real user experience
- Browser compatibility
- Detecting visual regressions

[Details →](/en/testing-e2e)

---

## Testing Pyramid

```
       /\
      /  \     E2E (Playwright)
     /    \    - Few, slow, brittle
    /------\
   /        \  Property-based (fast-check)
  /          \ - Medium quantity, invariants
 /------------\
/              \ Unit (Vitest)
\______________/ - Many, fast, stable
```

## Quick Commands

```bash
# Unit tests
cd apps/web && bun test

# Property-based tests
cd apps/web && bun test:pbt

# E2E tests
cd apps/web && bunx playwright test

# Watch mode (during development)
cd apps/web && bunx vitest
```

**Detailed commands:** [Scripts reference →](/en/scripts)

## Testing Conventions

- **Filename:** `[filename].test.ts` or `[filename].spec.ts`
- **Location:** Next to the tested file
- **Describe block:** Name of the tested unit
- **It block:** Description of specific behavior
- **Pattern:** Arrange-Act-Assert
- **Coverage:** At least one test for every public function
- **Edge cases:** Test empty input, null, boundary values

## Faker – Test Data

Generating random but realistic test data:

```typescript
import { faker } from '@faker-js/faker';

const testUser = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 })
};
```

## Next Steps

- [Vitest unit tests →](/en/testing-vitest)
- [Property-based tests →](/en/testing-pbt)
- [E2E tests with Playwright →](/en/testing-e2e)
