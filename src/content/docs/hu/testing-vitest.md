---
title: Vitest Unit Tesztek
description: Unit tesztelés Vitest-tel a Rocona projektben
prev:
  link: /hu/testing/
  label: Tesztelés
---

A Vitest egy gyors, modern unit teszt keretrendszer, amely natívan támogatja a TypeScript-et és a Vite-ot.

## Alapok

### Teszt futtatás

```bash
# Egyszeri futtatás (CI/CD)
cd apps/web && bun test

# Watch mód (fejlesztés közben)
cd apps/web && bunx vitest

# Lefedettség mérés
cd apps/web && bunx vitest --coverage
```

### Teszt fájl létrehozása

A teszteket a tesztelt fájl mellé helyezzük `.test.ts` vagy `.spec.ts` kiterjesztéssel:

```
src/lib/utils/
├── format.ts
└── format.test.ts
```

## Példa teszt

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formázza a pénzösszeget forintban', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('1 234,56 Ft');
  });

  it('kerekíti a filléreket', () => {
    const result = formatCurrency(1234.567);
    expect(result).toBe('1 234,57 Ft');
  });

  it('kezeli a nulla értéket', () => {
    const result = formatCurrency(0);
    expect(result).toBe('0,00 Ft');
  });

  it('kezeli a negatív értékeket', () => {
    const result = formatCurrency(-500);
    expect(result).toBe('-500,00 Ft');
  });
});
```

## Mocking

### Függvény mock

```typescript
import { vi, describe, it, expect } from 'vitest';

describe('sendEmail', () => {
  it('meghívja a nodemailer-t a megfelelő paraméterekkel', async () => {
    const mockSend = vi.fn().mockResolvedValue({ messageId: '123' });

    await sendEmail({
      to: 'test@example.com',
      subject: 'Teszt',
      html: '<p>Teszt üzenet</p>'
    });

    expect(mockSend).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Teszt',
      html: '<p>Teszt üzenet</p>'
    });
  });
});
```

### Modul mock

```typescript
import { vi } from 'vitest';

// Teljes modul mock
vi.mock('$lib/server/database/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Részleges modul mock
vi.mock('$lib/utils/date', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCurrentDate: vi.fn(() => new Date('2024-01-01'))
  };
});
```

## Svelte komponens tesztelés

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('rendereli a szöveget', () => {
    render(Button, { props: { children: 'Kattints ide' } });
    expect(screen.getByText('Kattints ide')).toBeInTheDocument();
  });

  it('meghívja az onclick handlert', async () => {
    const handleClick = vi.fn();
    const { component } = render(Button, {
      props: { onclick: handleClick }
    });

    await component.$set({ onclick: handleClick });
    const button = screen.getByRole('button');
    await button.click();

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('disabled állapotban nem kattintható', () => {
    render(Button, { props: { disabled: true } });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

## Store tesztelés

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWindowManager } from '$lib/stores/window-manager.svelte';

describe('WindowManager', () => {
  let manager: ReturnType<typeof createWindowManager>;

  beforeEach(() => {
    manager = createWindowManager();
  });

  it('új ablak megnyitása', () => {
    manager.openWindow({
      id: 'test-1',
      appId: 'settings',
      title: 'Beállítások'
    });

    expect(manager.windows).toHaveLength(1);
    expect(manager.windows[0].id).toBe('test-1');
  });

  it('ablak bezárása', () => {
    manager.openWindow({ id: 'test-1', appId: 'settings' });
    manager.closeWindow('test-1');

    expect(manager.windows).toHaveLength(0);
  });

  it('aktív ablak váltás', () => {
    manager.openWindow({ id: 'test-1', appId: 'settings' });
    manager.openWindow({ id: 'test-2', appId: 'users' });

    manager.focusWindow('test-1');

    expect(manager.activeWindowId).toBe('test-1');
  });
});
```

## Server Action tesztelés

```typescript
import { describe, it, expect, vi } from 'vitest';
import { updateUserProfile } from './profile.remote';

describe('updateUserProfile', () => {
  it('frissíti a felhasználó profilját', async () => {
    // Mock request event
    vi.mock('$app/server', () => ({
      getRequestEvent: () => ({
        locals: {
          session: { userId: '123' }
        }
      })
    }));

    const result = await updateUserProfile({
      name: 'Teszt Felhasználó',
      email: 'test@example.com'
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('Teszt Felhasználó');
  });

  it('hibát dob érvénytelen email esetén', async () => {
    const result = await updateUserProfile({
      name: 'Teszt',
      email: 'invalid-email'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });
});
```

## Aszinkron tesztelés

```typescript
import { describe, it, expect } from 'vitest';

describe('fetchUserData', () => {
  it('lekéri a felhasználó adatait', async () => {
    const data = await fetchUserData('123');

    expect(data).toMatchObject({
      id: '123',
      name: expect.any(String),
      email: expect.any(String)
    });
  });

  it('hibát dob nem létező felhasználó esetén', async () => {
    await expect(fetchUserData('invalid')).rejects.toThrow('User not found');
  });
});
```

## Teszt adatok generálása

```typescript
import { faker } from '@faker-js/faker';

describe('User validation', () => {
  it('validálja a felhasználói adatokat', () => {
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

## Hasznos matcher-ek

```typescript
// Egyenlőség
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).toStrictEqual(expected);  // Strict deep equality

// Típusok
expect(value).toBeTypeOf('string');
expect(value).toBeInstanceOf(Date);

// Számok
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.3, 5);      // Float összehasonlítás

// Stringek
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Tömbök
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });

// Objektumok
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Kivételek
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('Error message');

// Aszinkron
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Lifecycle hook-ok

```typescript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('Database tests', () => {
  // Egyszer fut a suite előtt
  beforeAll(async () => {
    await connectDatabase();
  });

  // Egyszer fut a suite után
  afterAll(async () => {
    await disconnectDatabase();
  });

  // Minden teszt előtt fut
  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
  });

  // Minden teszt után fut
  afterEach(async () => {
    await cleanupTestData();
  });

  it('teszt 1', () => {
    // ...
  });

  it('teszt 2', () => {
    // ...
  });
});
```

## Konfigurációs tippek

A `vite.config.ts` fájlban:

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

## Best practice-ek

1. **AAA minta:** Arrange (előkészítés), Act (végrehajtás), Assert (ellenőrzés)
2. **Egy teszt, egy állítás:** Lehetőleg egy dolgot tesztelj egy tesztben
3. **Beszédes nevek:** A teszt neve mondja el, mit tesztel
4. **Független tesztek:** Egyik teszt ne függjön a másiktól
5. **Mock-ok tisztítása:** Minden teszt után tisztítsd meg a mock-okat
6. **Edge case-ek:** Teszteld az üres, null, undefined eseteket
7. **Gyors tesztek:** Unit tesztek legyenek gyorsak (< 100ms)

## Következő lépések

- [Property-based tesztek →](/hu/testing-pbt)
- [E2E tesztek →](/hu/testing-e2e)
- [Tesztelés áttekintés →](/hu/testing)
