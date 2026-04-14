---
title: Vitest Unit Tests
description: Unit testing with Vitest in the Racona project
prev:
  link: /en/testing/
  label: Testing
---

Vitest is a fast, modern unit testing framework with native TypeScript and Vite support.

## Basics

### Running tests

```bash
# Single run (CI/CD)
cd apps/web && bun test

# Watch mode (during development)
cd apps/web && bunx vitest

# Coverage measurement
cd apps/web && bunx vitest --coverage
```

### Creating a test file

Place tests next to the file being tested with a `.test.ts` or `.spec.ts` extension:

```
src/lib/utils/
├── format.ts
└── format.test.ts
```

## Example test

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formats the amount in HUF', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('1 234,56 Ft');
  });

  it('rounds cents', () => {
    const result = formatCurrency(1234.567);
    expect(result).toBe('1 234,57 Ft');
  });

  it('handles zero value', () => {
    const result = formatCurrency(0);
    expect(result).toBe('0,00 Ft');
  });

  it('handles negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toBe('-500,00 Ft');
  });
});
```

## Mocking

### Function mock

```typescript
import { vi, describe, it, expect } from 'vitest';

describe('sendEmail', () => {
  it('calls nodemailer with the correct parameters', async () => {
    const mockSend = vi.fn().mockResolvedValue({ messageId: '123' });

    await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test message</p>'
    });

    expect(mockSend).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test message</p>'
    });
  });
});
```

### Module mock

```typescript
import { vi } from 'vitest';

// Full module mock
vi.mock('$lib/server/database/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Partial module mock
vi.mock('$lib/utils/date', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCurrentDate: vi.fn(() => new Date('2024-01-01'))
  };
});
```

## Svelte component testing

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders the text', () => {
    render(Button, { props: { children: 'Click here' } });
    expect(screen.getByText('Click here')).toBeInTheDocument();
  });

  it('calls the onclick handler', async () => {
    const handleClick = vi.fn();
    const { component } = render(Button, {
      props: { onclick: handleClick }
    });

    await component.$set({ onclick: handleClick });
    const button = screen.getByRole('button');
    await button.click();

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is not clickable when disabled', () => {
    render(Button, { props: { disabled: true } });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

## Store testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWindowManager } from '$lib/stores/window-manager.svelte';

describe('WindowManager', () => {
  let manager: ReturnType<typeof createWindowManager>;

  beforeEach(() => {
    manager = createWindowManager();
  });

  it('opens a new window', () => {
    manager.openWindow({
      id: 'test-1',
      appId: 'settings',
      title: 'Settings'
    });

    expect(manager.windows).toHaveLength(1);
    expect(manager.windows[0].id).toBe('test-1');
  });

  it('closes a window', () => {
    manager.openWindow({ id: 'test-1', appId: 'settings' });
    manager.closeWindow('test-1');

    expect(manager.windows).toHaveLength(0);
  });

  it('switches active window', () => {
    manager.openWindow({ id: 'test-1', appId: 'settings' });
    manager.openWindow({ id: 'test-2', appId: 'users' });

    manager.focusWindow('test-1');

    expect(manager.activeWindowId).toBe('test-1');
  });
});
```

## Server Action testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { updateUserProfile } from './profile.remote';

describe('updateUserProfile', () => {
  it('updates the user profile', async () => {
    // Mock request event
    vi.mock('$app/server', () => ({
      getRequestEvent: () => ({
        locals: {
          session: { userId: '123' }
        }
      })
    }));

    const result = await updateUserProfile({
      name: 'Test User',
      email: 'test@example.com'
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('Test User');
  });

  it('throws an error for invalid email', async () => {
    const result = await updateUserProfile({
      name: 'Test',
      email: 'invalid-email'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });
});
```

## Async testing

```typescript
import { describe, it, expect } from 'vitest';

describe('fetchUserData', () => {
  it('fetches user data', async () => {
    const data = await fetchUserData('123');

    expect(data).toMatchObject({
      id: '123',
      name: expect.any(String),
      email: expect.any(String)
    });
  });

  it('throws an error for non-existent user', async () => {
    await expect(fetchUserData('invalid')).rejects.toThrow('User not found');
  });
});
```

## Test data generation

```typescript
import { faker } from '@faker-js/faker';

describe('User validation', () => {
  it('validates user data', () => {
    const testUser = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      birthDate: faker.date.past({ years: 30 })
    };

    const result = validateUser(testUser);
    expect(result.valid).toBe(true);
  });
});
```

## Useful matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).toStrictEqual(expected);  // Strict deep equality

// Types
expect(value).toBeTypeOf('string');
expect(value).toBeInstanceOf(Date);

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.3, 5);      // Float comparison

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('Error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Lifecycle hooks

```typescript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('Database tests', () => {
  // Runs once before the suite
  beforeAll(async () => {
    await connectDatabase();
  });

  // Runs once after the suite
  afterAll(async () => {
    await disconnectDatabase();
  });

  // Runs before each test
  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
  });

  // Runs after each test
  afterEach(async () => {
    await cleanupTestData();
  });

  it('test 1', () => {
    // ...
  });

  it('test 2', () => {
    // ...
  });
});
```

## Configuration tips

In `vite.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
});
```

## Best practices

1. **AAA pattern:** Arrange, Act, Assert
2. **One test, one assertion:** Test one thing per test when possible
3. **Descriptive names:** The test name should describe what it tests
4. **Independent tests:** Tests should not depend on each other
5. **Clean up mocks:** Clear mocks after each test
6. **Edge cases:** Test empty, null, and undefined cases
7. **Fast tests:** Unit tests should be fast (< 100ms)

## Next steps

- [Property-based tests →](/en/testing-pbt)
- [E2E tests →](/en/testing-e2e)
- [Testing overview →](/en/testing)
