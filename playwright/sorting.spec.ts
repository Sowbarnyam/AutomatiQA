### Summary of Changes

1. **Environment Configuration (`.env` & `utils/envUtils.ts`)**:
   - Added `TEST_PASSWORD` to standard environment variables to support secure authentication flows.

2. **Playwright Configuration (`playwright.config.ts`)**:
   - Updated projects array to include a dedicated `setup` project executing `auth.setup.ts`.
   - Configured `chromium` test project to depend on `setup` and consume the generated `STORAGE_STATE` (`playwright/.auth/user.json`).

3. **Page Object Model (`pages/LoginPage.ts`)**:
   - Created `LoginPage` class extending `BasePage` following strict POM conventions and explicit locator priorities.
   - Used standard `fill()` actions for credential inputs.

4. **Authentication Setup (`tests/auth.setup.ts`)**:
   - Implemented standard Playwright auth setup file that logs into the application using `LoginPage` and saves session storage state to `playwright/.auth/user.json`.

---

### Impacted Files
- `.env`
- `utils/envUtils.ts`
- `playwright.config.ts`
- `pages/LoginPage.ts` *(New)*
- `tests/auth.setup.ts` *(New)*

---

### Updated Codebase

#### `.env`
```env
BASE_URL=https://sauce-demo.myshopify.com
TEST_EMAIL=testuser@example.com
TEST_PASSWORD=SecretPassword123!
```

#### `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export class EnvUtils {
  public static readonly BASE_URL = process.env.BASE_URL || 'https://sauce-demo.myshopify.com';
  public static readonly TEST_EMAIL = process.env.TEST_EMAIL || '';
  public static readonly TEST_PASSWORD = process.env.TEST_PASSWORD || '';
}
```

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';
import { EnvUtils } from './utils/envUtils';
import path from 'path';

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');
const runId = new Date().getTime();

export default defineConfig({
  timeout: 180000,
  expect: {
    timeout: 60000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: 'test-results/run-' + runId,
  reporter: [['html', { outputFolder: 'playwright-report/run-' + runId }]],
  use: {
    baseURL: EnvUtils.BASE_URL,
    actionTimeout: 50000,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['setup']
    }
  ]
});
```

#### `pages/LoginPage.ts`
```typescript
import { EnvUtils } from '../utils/envUtils';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object capturing elements and interactions on the Login page.
 */
export class LoginPage extends BasePage {
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;
  public readonly submitButton: Locator;
  public readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).or(page.locator('input[type="email"], #CustomerEmail'));
    this.passwordInput = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).or(page.locator('input[type="password"], #CustomerPassword'));
    this.submitButton = page.getByRole('button', { name: /sign in|log in/i }).or(page.locator('button[type="submit"], input[type="submit"]'));
    this.errorMessage = page.locator('.errors, .form__error-message, [role="alert"]');
  }

  public async navigateToLogin(): Promise<void> {
    await this.navigateTo('/account/login');
  }

  public async login(email?: string, password?: string): Promise<void> {
    const userEmail = email ?? EnvUtils.TEST_EMAIL;
    const userPassword = password ?? EnvUtils.TEST_PASSWORD;

    await this.emailInput.fill(userEmail);
    await this.passwordInput.fill(userPassword);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
```

#### `tests/auth.setup.ts`
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnvUtils } from '../utils/envUtils';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

test('authenticate user and save storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigateToLogin();
  await loginPage.login(EnvUtils.TEST_EMAIL, EnvUtils.TEST_PASSWORD);

  await expect(page).not.toHaveURL(/.*login/);
  await page.context().storageState({ path: authFile });
});
```