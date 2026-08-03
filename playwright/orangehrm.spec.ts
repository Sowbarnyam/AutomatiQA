This is a production-ready QA Automation framework built using **Playwright** and **TypeScript**, engineered with the Page Object Model (POM) architecture, environment-based configuration management, explicit setup hooks, and enterprise-grade test reporting and retry mechanisms.

---

### 📂 Folder Structure

```
automation-project/
├── .env
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── ResetPasswordPage.ts
├── tests/
│   ├── auth.setup.ts
│   ├── login.spec.ts
│   └── reset-password.spec.ts
└── utils/
    └── envUtils.ts
```

---

### --- Configuration & Dependencies

#### `.env`
```env
# Required application URL and user credentials
BASE_URL=https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
TEST_USERNAME=Admin
TEST_PASSWORD=admin123
```

#### `package.json`
```json
{
  "name": "orangehrm-playwright-typescript-framework",
  "version": "1.0.0",
  "description": "Enterprise Playwright TypeScript Test Automation Framework",
  "main": "index.js",
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:report": "npx playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.0",
    "@types/node": "^20.11.0",
    "dotenv": "^16.4.5",
    "typescript": "^5.3.3"
  }
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
  testDir: './tests',
  outputDir: 'test-results/run-' + runId,
  timeout: 180000,
  expect: {
    timeout: 60000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report/run-' + runId }]
  ],
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

#### `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export class EnvUtils {
  public static readonly BASE_URL: string = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
  public static readonly TEST_USERNAME: string = process.env.TEST_USERNAME || 'Admin';
  public static readonly TEST_PASSWORD: string = process.env.TEST_PASSWORD || 'admin123';
}
```

---

### --- Page Object Model (POM)

#### `pages/BasePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * Abstract Base Page providing essential foundational interactions and explicit assertion wrappers.
 */
export abstract class BasePage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  public async clickElement(locator: Locator): Promise<void> {
    await this.waitForEnabled(locator);
    await locator.click();
  }

  public async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(text);
  }

  public async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) || '';
  }
}
```

#### `pages/LoginPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EnvUtils } from '../utils/envUtils';

export class LoginPage extends BasePage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByPlaceholder('Username');
    this.passwordInput = this.page.getByPlaceholder('Password');
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = this.page.getByText('Forgot your password?');
  }

  public async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(EnvUtils.BASE_URL);
  }

  public async enterUsername(username: string): Promise<void> {
    await this.fillInput(this.usernameInput, username);
  }

  public async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  public async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  public async pressEnterToLogin(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  public async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  public async login(username: string = EnvUtils.TEST_USERNAME, password: string = EnvUtils.TEST_PASSWORD): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }
}
```

#### `pages/ResetPasswordPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ResetPasswordPage extends BasePage {
  public readonly resetHeader: Locator;
  public readonly usernameInput: Locator;
  public readonly resetPasswordButton: Locator;
  public readonly cancelButton: Locator;
  public readonly requiredValidationMessage: Locator;
  public readonly successHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.resetHeader = this.page.getByRole('heading', { name: 'Reset Password' });
    this.usernameInput = this.page.getByPlaceholder('Username');
    this.resetPasswordButton = this.page.getByRole('button', { name: 'Reset Password' });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    this.requiredValidationMessage = this.page.getByText('Required');
    this.successHeader = this.page.getByRole('heading', { name: 'Reset Password link sent successfully' });
  }

  public async enterUsername(username: string): Promise<void> {
    await this.fillInput(this.usernameInput, username);
  }

  public async clickResetPassword(): Promise<void> {
    await this.clickElement(this.resetPasswordButton);
  }

  public async clickCancel(): Promise<void> {
    await this.clickElement(this.cancelButton);
  }
}
```

---

### --- Test Implementation

#### `tests/auth.setup.ts`
```typescript
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnvUtils } from '../utils/envUtils';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('Authenticate user and capture storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigateToLoginPage();
  await loginPage.login(EnvUtils.TEST_USERNAME, EnvUtils.TEST_PASSWORD);
  
  // Verify successful authentication before saving state
  await expect(page).toHaveURL(/.*dashboard/);
  await page.context().storageState({ path: authFile });
});
```

#### `tests/login.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Login Functional Tests', () => {
  // Override storage state for direct login validation tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLoginPage();
  });

  test('Verify successful login using valid credentials with Login button click', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);

    await loginPage.enterUsername(EnvUtils.TEST_USERNAME);
    await loginPage.enterPassword(EnvUtils.TEST_PASSWORD);
    await loginPage.clickLoginButton();

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Verify successful login using keyboard Enter key after inputting credentials', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);

    await loginPage.enterUsername(EnvUtils.TEST_USERNAME);
    await loginPage.enterPassword(EnvUtils.TEST_PASSWORD);
    await loginPage.pressEnterToLogin();

    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

#### `tests/reset-password.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

test.describe('Reset Password Functional and UI Tests', () => {
  // Reset password tests run from clean, unauthenticated context
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLoginPage();
  });

  test('Verify navigation to Reset Password page using "Forgot your password?" link', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);

    await loginPage.clickForgotPassword();

    await expect(page).toHaveURL(/.*requestPasswordResetCode/);
    await expect(resetPasswordPage.resetHeader).toBeVisible();
  });

  test('Verify UI layout and components on the Reset Password page', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);

    await loginPage.clickForgotPassword();

    await expect(resetPasswordPage.resetHeader).toBeVisible();
    await expect(resetPasswordPage.usernameInput).toBeVisible();
    await expect(resetPasswordPage.resetPasswordButton).toBeVisible();
    await expect(resetPasswordPage.cancelButton).toBeVisible();
  });

  test('Verify submission of password reset request with a valid username', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);

    await loginPage.clickForgotPassword();
    await resetPasswordPage.enterUsername('Admin');
    await resetPasswordPage.clickResetPassword();

    await expect(resetPasswordPage.successHeader).toBeVisible();
  });

  test('Verify field validation when submitting password reset form with blank username', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const resetPasswordPage = new ResetPasswordPage(page);

    await loginPage.clickForgotPassword();
    await resetPasswordPage.clickResetPassword();

    await expect(resetPasswordPage.requiredValidationMessage).toBeVisible();
  });
});
```