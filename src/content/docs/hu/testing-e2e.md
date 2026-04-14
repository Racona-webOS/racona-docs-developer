---
title: E2E Tesztek Playwright-tal
description: End-to-end tesztelés Playwright-tal a Rocona projektben
---

A Playwright egy modern böngésző automatizálási keretrendszer, amely lehetővé teszi a teljes felhasználói folyamatok tesztelését valós böngésző környezetben.

## Alapok

### Telepítés és futtatás

```bash
# Playwright telepítése (már telepítve van)
bun add -d @playwright/test

# Böngészők telepítése
bunx playwright install

# E2E tesztek futtatása
cd apps/web && bunx playwright test

# UI módban (interaktív)
cd apps/web && bunx playwright test --ui

# Headed módban (látható böngésző)
cd apps/web && bunx playwright test --headed

# Specifikus teszt futtatása
cd apps/web && bunx playwright test login.spec.ts

# Debug mód
cd apps/web && bunx playwright test --debug
```

### Teszt fájl létrehozása

E2E teszteket a `tests/` vagy `e2e/` könyvtárba helyezzük `.spec.ts` kiterjesztéssel:

```
apps/web/
├── src/
└── tests/
    ├── auth/
    │   ├── login.spec.ts
    │   └── register.spec.ts
    ├── apps/
    │   ├── settings.spec.ts
    │   └── users.spec.ts
    └── fixtures/
        └── test-data.ts
```

## Alapvető példa

```typescript
import { test, expect } from '@playwright/test';

test.describe('Bejelentkezés', () => {
  test('sikeres bejelentkezés email és jelszó használatával', async ({ page }) => {
    // Navigálás a bejelentkezési oldalra
    await page.goto('/login');

    // Űrlap kitöltése
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Bejelentkezés gomb kattintás
    await page.click('button[type="submit"]');

    // Ellenőrzés: átirányítás a főoldalra
    await expect(page).toHaveURL('/');

    // Ellenőrzés: felhasználó neve megjelenik
    await expect(page.locator('text=Teszt Felhasználó')).toBeVisible();
  });

  test('hibaüzenet helytelen jelszó esetén', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Ellenőrzés: hibaüzenet megjelenik
    await expect(page.locator('text=Helytelen email vagy jelszó')).toBeVisible();

    // Ellenőrzés: továbbra is a login oldalon vagyunk
    await expect(page).toHaveURL('/login');
  });
});
```

## Locator-ok (Elem kiválasztás)

### Ajánlott módszerek

```typescript
// Role alapú (legjobb)
await page.getByRole('button', { name: 'Bejelentkezés' });
await page.getByRole('textbox', { name: 'Email' });
await page.getByRole('link', { name: 'Regisztráció' });

// Label alapú
await page.getByLabel('Email cím');
await page.getByLabel('Jelszó');

// Placeholder alapú
await page.getByPlaceholder('Írja be az email címét');

// Text alapú
await page.getByText('Üdvözöljük!');
await page.getByText(/sikeres/i); // Regex, case-insensitive

// Test ID alapú (ha van data-testid)
await page.getByTestId('login-button');
```

### Kerülendő módszerek

```typescript
// CSS selector (törékeny)
await page.locator('.btn-primary');
await page.locator('#login-form button');

// XPath (nehezen olvasható)
await page.locator('//button[@type="submit"]');
```

## Interakciók

### Kattintás

```typescript
// Egyszerű kattintás
await page.click('button');

// Dupla kattintás
await page.dblclick('button');

// Jobb klikk
await page.click('button', { button: 'right' });

// Modifier billentyűkkel
await page.click('a', { modifiers: ['Control'] });
```

### Szöveg bevitel

```typescript
// Szöveg beírása
await page.fill('input[name="email"]', 'test@example.com');

// Karakterenkénti beírás (lassabb, de valósághűbb)
await page.type('input[name="email"]', 'test@example.com', { delay: 100 });

// Szöveg törlése
await page.fill('input[name="email"]', '');

// Billentyű lenyomás
await page.press('input', 'Enter');
await page.press('input', 'Control+A');
```

### Kiválasztás

```typescript
// Dropdown kiválasztás
await page.selectOption('select[name="country"]', 'Hungary');
await page.selectOption('select', { label: 'Magyarország' });
await page.selectOption('select', { value: 'hu' });

// Checkbox
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Radio button
await page.check('input[value="option1"]');
```

### Fájl feltöltés

```typescript
// Egyetlen fájl
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Több fájl
await page.setInputFiles('input[type="file"]', [
  'path/to/file1.pdf',
  'path/to/file2.pdf'
]);

// Fájl eltávolítása
await page.setInputFiles('input[type="file"]', []);
```

## Várakozás

### Automatikus várakozás

A Playwright automatikusan vár az elemekre:

```typescript
// Automatikusan vár, amíg az elem látható és kattintható
await page.click('button');

// Automatikusan vár, amíg az elem látható
await expect(page.locator('text=Sikeres mentés')).toBeVisible();
```

### Explicit várakozás

```typescript
// Várakozás navigációra
await page.waitForURL('/dashboard');

// Várakozás elemre
await page.waitForSelector('text=Betöltve');

// Várakozás állapotra
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Várakozás időre (kerülendő!)
await page.waitForTimeout(1000);

// Várakozás függvényre
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 5;
});
```

## Assertions (Ellenőrzések)

### Oldal ellenőrzések

```typescript
// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/dashboard/);

// Cím
await expect(page).toHaveTitle('Racona - Dashboard');
await expect(page).toHaveTitle(/Dashboard/);
```

### Elem ellenőrzések

```typescript
// Láthatóság
await expect(page.locator('text=Üdvözöljük')).toBeVisible();
await expect(page.locator('text=Betöltés')).toBeHidden();

// Szöveg
await expect(page.locator('h1')).toHaveText('Beállítások');
await expect(page.locator('h1')).toContainText('Beállítás');

// Érték
await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');

// Attribútum
await expect(page.locator('button')).toHaveAttribute('disabled');
await expect(page.locator('a')).toHaveAttribute('href', '/profile');

// CSS osztály
await expect(page.locator('button')).toHaveClass(/btn-primary/);

// Állapot
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('button')).toBeEnabled();

// Darabszám
await expect(page.locator('.item')).toHaveCount(5);
```

## Racona specifikus példák

### Alkalmazás megnyitása

```typescript
test('Settings alkalmazás megnyitása', async ({ page }) => {
  await page.goto('/');

  // Bejelentkezés
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Start menü megnyitása
  await page.click('[data-testid="start-menu-button"]');

  // Settings alkalmazás indítása
  await page.click('text=Beállítások');

  // Ellenőrzés: ablak megnyílt
  await expect(page.locator('[data-testid="window-settings"]')).toBeVisible();

  // Ellenőrzés: ablak címe
  await expect(page.locator('[data-testid="window-settings"] .window-title'))
    .toHaveText('Beállítások');
});
```

### Ablak műveletek

```typescript
test('Ablak mozgatása és átméretezése', async ({ page }) => {
  await page.goto('/');

  // Alkalmazás megnyitása
  await page.click('text=Beállítások');

  const window = page.locator('[data-testid="window-settings"]');

  // Ablak mozgatása
  const titleBar = window.locator('.window-title-bar');
  await titleBar.dragTo(page.locator('body'), {
    targetPosition: { x: 100, y: 100 }
  });

  // Ablak maximalizálása
  await window.locator('[data-testid="maximize-button"]').click();
  await expect(window).toHaveClass(/maximized/);

  // Ablak bezárása
  await window.locator('[data-testid="close-button"]').click();
  await expect(window).toBeHidden();
});
```

### Felhasználó kezelés

```typescript
test('Új felhasználó létrehozása', async ({ page }) => {
  await page.goto('/');

  // Admin bejelentkezés
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Users alkalmazás megnyitása
  await page.click('[data-testid="start-menu-button"]');
  await page.click('text=Felhasználók');

  // Új felhasználó gomb
  await page.click('button:has-text("Új felhasználó")');

  // Űrlap kitöltése
  await page.fill('input[name="name"]', 'Teszt Felhasználó');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.selectOption('select[name="role"]', 'user');

  // Mentés
  await page.click('button:has-text("Mentés")');

  // Ellenőrzés: sikeres üzenet
  await expect(page.locator('text=Felhasználó sikeresen létrehozva')).toBeVisible();

  // Ellenőrzés: új felhasználó megjelenik a listában
  await expect(page.locator('text=Teszt Felhasználó')).toBeVisible();
});
```

## Fixtures és setup

### Bejelentkezési fixture

```typescript
// tests/fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Bejelentkezés
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Fixture használata
    await use(page);

    // Cleanup (opcionális)
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Kijelentkezés');
  }
});

// Használat
import { test } from './fixtures/auth';

test('Dashboard elérése', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.locator('h1')).toHaveText('Dashboard');
});
```

### Global setup

```typescript
// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Adatbázis inicializálás
  await setupTestDatabase();

  // Admin felhasználó létrehozása
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('/setup');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await browser.close();
}

export default globalSetup;
```

## Konfigurációs fájl

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

## Best practice-ek

1. **Page Object Model:** Szervezd ki az oldal interakciókat külön osztályokba
2. **Stabil locator-ok:** Használj role, label, text alapú locator-okat
3. **Független tesztek:** Minden teszt legyen független a többitől
4. **Cleanup:** Minden teszt után tisztítsd meg az állapotot
5. **Várakozás:** Használd az automatikus várakozást, kerüld a `waitForTimeout`-ot
6. **Párhuzamosítás:** Tesztek legyenek párhuzamosan futtathatók
7. **Screenshot/video:** Csak hiba esetén mentsd el
8. **CI/CD:** Futtasd a teszteket minden commit-nál

## Hibakeresés

```bash
# Debug mód (lépésenkénti végrehajtás)
bunx playwright test --debug

# UI mód (interaktív)
bunx playwright test --ui

# Trace viewer (hiba után)
bunx playwright show-trace trace.zip

# Codegen (teszt generálás)
bunx playwright codegen http://localhost:5173
```

## Következő lépések

- [Vitest unit tesztek →](/hu/testing-vitest)
- [Property-based tesztek →](/hu/testing-pbt)
- [Tesztelés áttekintés →](/hu/testing)
- [Playwright dokumentáció ↗](https://playwright.dev/)
