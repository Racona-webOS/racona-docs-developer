---
title: E2E Tests with Playwright
description: End-to-end testing with Playwright in the Racona project
---

Playwright is a modern browser automation framework that enables testing complete user flows in a real browser environment.

## Basics

### Installation and running

```bash
# Install Playwright (already installed)
bun add -d @playwright/test

# Install browsers
bunx playwright install

# Run E2E tests
cd apps/web && bunx playwright test

# UI mode (interactive)
cd apps/web && bunx playwright test --ui

# Headed mode (visible browser)
cd apps/web && bunx playwright test --headed

# Run a specific test
cd apps/web && bunx playwright test login.spec.ts

# Debug mode
cd apps/web && bunx playwright test --debug
```

### Creating a test file

Place E2E tests in the `tests/` or `e2e/` directory with a `.spec.ts` extension:

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

## Basic example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('successful login with email and password', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Fill in the form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click the login button
    await page.click('button[type="submit"]');

    // Verify: redirect to home page
    await expect(page).toHaveURL('/');

    // Verify: user name is displayed
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('error message for incorrect password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify: error message is displayed
    await expect(page.locator('text=Incorrect email or password')).toBeVisible();

    // Verify: still on the login page
    await expect(page).toHaveURL('/login');
  });
});
```

## Locators (Element selection)

### Recommended methods

```typescript
// Role-based (best)
await page.getByRole('button', { name: 'Login' });
await page.getByRole('textbox', { name: 'Email' });
await page.getByRole('link', { name: 'Register' });

// Label-based
await page.getByLabel('Email address');
await page.getByLabel('Password');

// Placeholder-based
await page.getByPlaceholder('Enter your email address');

// Text-based
await page.getByText('Welcome!');
await page.getByText(/success/i); // Regex, case-insensitive

// Test ID-based (if data-testid is present)
await page.getByTestId('login-button');
```

### Methods to avoid

```typescript
// CSS selector (fragile)
await page.locator('.btn-primary');
await page.locator('#login-form button');

// XPath (hard to read)
await page.locator('//button[@type="submit"]');
```

## Interactions

### Clicking

```typescript
// Simple click
await page.click('button');

// Double click
await page.dblclick('button');

// Right click
await page.click('button', { button: 'right' });

// With modifier keys
await page.click('a', { modifiers: ['Control'] });
```

### Text input

```typescript
// Type text
await page.fill('input[name="email"]', 'test@example.com');

// Type character by character (slower, more realistic)
await page.type('input[name="email"]', 'test@example.com', { delay: 100 });

// Clear text
await page.fill('input[name="email"]', '');

// Press a key
await page.press('input', 'Enter');
await page.press('input', 'Control+A');
```

### Selection

```typescript
// Dropdown selection
await page.selectOption('select[name="country"]', 'Hungary');
await page.selectOption('select', { label: 'Hungary' });
await page.selectOption('select', { value: 'hu' });

// Checkbox
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Radio button
await page.check('input[value="option1"]');
```

### File upload

```typescript
// Single file
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Multiple files
await page.setInputFiles('input[type="file"]', [
  'path/to/file1.pdf',
  'path/to/file2.pdf'
]);

// Remove file
await page.setInputFiles('input[type="file"]', []);
```

## Waiting

### Automatic waiting

Playwright automatically waits for elements:

```typescript
// Automatically waits until the element is visible and clickable
await page.click('button');

// Automatically waits until the element is visible
await expect(page.locator('text=Saved successfully')).toBeVisible();
```

### Explicit waiting

```typescript
// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for element
await page.waitForSelector('text=Loaded');

// Wait for state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Wait for time (avoid!)
await page.waitForTimeout(1000);

// Wait for function
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 5;
});
```

## Assertions

### Page assertions

```typescript
// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/dashboard/);

// Title
await expect(page).toHaveTitle('Racona - Dashboard');
await expect(page).toHaveTitle(/Dashboard/);
```

### Element assertions

```typescript
// Visibility
await expect(page.locator('text=Welcome')).toBeVisible();
await expect(page.locator('text=Loading')).toBeHidden();

// Text
await expect(page.locator('h1')).toHaveText('Settings');
await expect(page.locator('h1')).toContainText('Setting');

// Value
await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');

// Attribute
await expect(page.locator('button')).toHaveAttribute('disabled');
await expect(page.locator('a')).toHaveAttribute('href', '/profile');

// CSS class
await expect(page.locator('button')).toHaveClass(/btn-primary/);

// State
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('button')).toBeEnabled();

// Count
await expect(page.locator('.item')).toHaveCount(5);
```

## Racona-specific examples

### Opening an application

```typescript
test('Opening the Settings application', async ({ page }) => {
  await page.goto('/');

  // Login
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Open Start menu
  await page.click('[data-testid="start-menu-button"]');

  // Launch Settings application
  await page.click('text=Settings');

  // Verify: window opened
  await expect(page.locator('[data-testid="window-settings"]')).toBeVisible();

  // Verify: window title
  await expect(page.locator('[data-testid="window-settings"] .window-title'))
    .toHaveText('Settings');
});
```

### Window operations

```typescript
test('Moving and resizing a window', async ({ page }) => {
  await page.goto('/');

  // Open application
  await page.click('text=Settings');

  const window = page.locator('[data-testid="window-settings"]');

  // Move window
  const titleBar = window.locator('.window-title-bar');
  await titleBar.dragTo(page.locator('body'), {
    targetPosition: { x: 100, y: 100 }
  });

  // Maximize window
  await window.locator('[data-testid="maximize-button"]').click();
  await expect(window).toHaveClass(/maximized/);

  // Close window
  await window.locator('[data-testid="close-button"]').click();
  await expect(window).toBeHidden();
});
```

### User management

```typescript
test('Creating a new user', async ({ page }) => {
  await page.goto('/');

  // Admin login
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Open Users application
  await page.click('[data-testid="start-menu-button"]');
  await page.click('text=Users');

  // New user button
  await page.click('button:has-text("New user")');

  // Fill in the form
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.selectOption('select[name="role"]', 'user');

  // Save
  await page.click('button:has-text("Save")');

  // Verify: success message
  await expect(page.locator('text=User created successfully')).toBeVisible();

  // Verify: new user appears in the list
  await expect(page.locator('text=Test User')).toBeVisible();
});
```

## Fixtures and setup

### Login fixture

```typescript
// tests/fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Use fixture
    await use(page);

    // Cleanup (optional)
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
  }
});

// Usage
import { test } from './fixtures/auth';

test('Accessing the dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.locator('h1')).toHaveText('Dashboard');
});
```

### Global setup

```typescript
// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Database initialization
  await setupTestDatabase();

  // Create admin user
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

## Configuration file

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

## Best practices

1. **Page Object Model:** Extract page interactions into separate classes
2. **Stable locators:** Use role, label, and text-based locators
3. **Independent tests:** Each test should be independent of others
4. **Cleanup:** Clean up state after each test
5. **Waiting:** Use automatic waiting, avoid `waitForTimeout`
6. **Parallelization:** Tests should be runnable in parallel
7. **Screenshot/video:** Save only on failure
8. **CI/CD:** Run tests on every commit

## Debugging

```bash
# Debug mode (step-by-step execution)
bunx playwright test --debug

# UI mode (interactive)
bunx playwright test --ui

# Trace viewer (after failure)
bunx playwright show-trace trace.zip

# Codegen (test generation)
bunx playwright codegen http://localhost:5173
```

## Next steps

- [Vitest unit tests →](/en/testing-vitest)
- [Property-based tests →](/en/testing-pbt)
- [Testing overview →](/en/testing)
- [Playwright documentation ↗](https://playwright.dev/)
