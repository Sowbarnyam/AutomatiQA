This is a production-ready, enterprise-grade QA Automation architecture built with **Playwright** and **TypeScript**. It implements the **Page Object Model (POM)** design pattern, strict type safety, environment configuration handling, dynamic reporting, secure credential management via environment variables, and authentication state persistence.

---

### 📂 Folder Structure

```text
automation-project/
├── .env
├── utils/
│   └── envUtils.ts
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── DashboardPage.ts
└── tests/
    ├── auth.setup.ts
    └── login.spec.ts
```

---

### --- Configuration & Dependencies

#### 1. `.env`

```env
# Application Under Test Configuration
BASE_URL=https://opensource-demo.orangehrmlive.com

# Sensitive Credentials (DO NOT HARDCODE IN SOURCE CODE)
TEST_USERNAME=Admin
TEST_PASSWORD=admin123
```

---

#### 2. `utils/envUtils.ts`

```typescript
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Utility class for managing environment variables and configuration settings.
 */
export class EnvUtils {
  public static readonly BASE_URL: string = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
  public static readonly TEST_USERNAME: string = process.env.TEST_USERNAME || 'Admin';
  public static readonly TEST_PASSWORD: string = process.env.TEST_PASSWORD || 'admin123';
}
```

---

#### 3. `package.json`

```json
{
  "name": "playwright-typescript-automation-framework",
  "version": "1.0.0",
  "description": "Production-ready QA Automation Framework using Playwright, TypeScript, and Page Object Model",
  "main": "index.js",
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:ui": "npx playwright test --ui",
    "report": "npx playwright show-report"
  },
  "keywords": [
    "playwright",
    "typescript",
    "automation",
    "testing",
    "pom"
  ],
  "author": "QA Architecture Team",
  "license": "ISC",
  "devDependencies": {
    "@playwright/test": "^1.42.1",
    "@types/node": "^20.11.24",
    "dotenv": "^16.4.5",
    "typescript": "^5.3.3"
  }
}
```

---

#### 4. `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import { EnvUtils } from './utils/envUtils';
import path from 'path';

/**
 * Path to store authentication state for user session reuse.
 */
const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

/**
 * Generate a unique timestamp for isolated test run outputs.
 */
const runId = new Date().getTime();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  expect: {
    timeout: 60000,
  },
  outputDir: `test-results/run-${runId}`,
  reporter: [
    ['html', { outputFolder: `playwright-report/run-${runId}`, open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: EnvUtils.BASE_URL,
    actionTimeout: 50000,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

### --- Page Object Model (POM)

#### 5. `pages/BasePage.ts`

```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * Abstract BasePage providing core wrapper methods for page actions and assertions.
 */
export abstract class BasePage {
  /**
   * Public access to Playwright Page object.
   */
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to a specific path or URL.
   * @param path Target URL path.
   */
  public async navigateTo(path: string = ''): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Fills an input field with specified text value.
   * @param locator Playwright Locator target.
   * @param value String value to enter.
   */
  public async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.fill(value);
  }

  /**
   * Clicks on a targeted element.
   * @param locator Playwright Locator target.
   */
  public async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
  }

  /**
   * Extracts text content from a specified locator safely.
   * @param locator Playwright Locator target.
   */
  public async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    return (await locator.textContent())?.trim() || '';
  }

  /**
   * Waits for an element to be enabled.
   * @param locator Playwright Locator target.
   * @param timeout Optional timeout override in milliseconds.
   */
  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  /**
   * Verifies element visibility.
   * @param locator Playwright Locator target.
   */
  public async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }
}
```

---

#### 6. `pages/LoginPage.ts`

```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EnvUtils } from '../utils/envUtils';

/**
 * Page Object capturing elements and behaviors for the Login Page.
 */
export class LoginPage extends BasePage {
  // Public locators adhering to Playwright priority rules
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly brandingLogo: Locator;
  public readonly loginHeading: Locator;
  public readonly errorMessageBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.brandingLogo = page.getByAltText('company-branding');
    this.loginHeading = page.getByRole('heading', { name: 'Login' });
    this.errorMessageBanner = page.getByRole('alert');
  }

  /**
   * Navigates directly to the Login page URL.
   */
  public async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(EnvUtils.BASE_URL);
  }

  /**
   * Enters username credentials.
   * @param username Target username.
   */
  public async enterUsername(username: string): Promise<void> {
    await this.fillInput(this.usernameInput, username);
  }

  /**
   * Enters password credentials.
   * @param password Target password.
   */
  public async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * Clicks the login submit button.
   */
  public async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  /**
   * Performs full login flow using provided credentials.
   * @param username Target username string.
   * @param password Target password string.
   */
  public async performLogin(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  /**
   * Retrieves displayed error alert text.
   */
  public async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessageBanner);
  }
}
```

---

#### 7. `pages/DashboardPage.ts`

```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object representing the main application Dashboard after authentication.
 */
export class DashboardPage extends BasePage {
  public readonly dashboardHeading: Locator;
  public readonly userDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
    this.userDropdown = page.locator('.oxd-userdropdown');
  }

  /**
   * Asserts that the dashboard header is visible confirming authentication success.
   */
  public async verifyDashboardLoaded(): Promise<void> {
    await expect(this.dashboardHeading).toBeVisible({ timeout: 15000 });
  }
}
```

---

### --- Test Implementation

#### 8. `tests/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EnvUtils } from '../utils/envUtils';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication Setup hook generating reusable user state file.
 */
setup('Authenticate user session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.navigateToLoginPage();
  await loginPage.performLogin(EnvUtils.TEST_USERNAME, EnvUtils.TEST_PASSWORD);
  await dashboardPage.verifyDashboardLoaded();

  // Persist session state into state storage JSON
  await page.context().storageState({ path: authFile });
});
```

---

#### 9. `tests/login.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Authentication & Login Module Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }: { page: Page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigateToLoginPage();
  });

  test('TC-TS-001-001: Verify successful authentication with valid credentials', async ({ page }: { page: Page }, testInfo) => {
    // Clear state for explicit positive authentication execution
    await page.context().clearCookies();
    await loginPage.navigateToLoginPage();

    await loginPage.performLogin(EnvUtils.TEST_USERNAME, EnvUtils.TEST_PASSWORD);
    await dashboardPage.verifyDashboardLoaded();
    await expect(dashboardPage.dashboardHeading).toHaveText('Dashboard');
  });

  test('TC-TS-001-002: Verify error handling when attempting login with invalid credentials', async ({ page }: { page: Page }, testInfo) => {
    await loginPage.performLogin('NonExistentUser', 'InvalidPassword123');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('TC-TS-001-003: Verify UI components and visual elements on the login page', async ({ page }: { page: Page }, testInfo) => {
    await expect(loginPage.brandingLogo).toBeVisible();
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    await loginPage.waitForEnabled(loginPage.loginButton);
  });

  test('TC-TS-002-001: Verify authentication failure when entering a valid username and an invalid password', async ({ page }: { page: Page }, testInfo) => {
    await loginPage.performLogin(EnvUtils.TEST_USERNAME, 'WrongPassword!');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-TS-002-002: Verify authentication failure when entering an unregistered username', async ({ page }: { page: Page }, testInfo) => {
    await loginPage.performLogin('unregistered_user@example.com', EnvUtils.TEST_PASSWORD);

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('TC-TS-002-003: Verify authentication failure when entering malformed or security script payloads', async ({ page }: { page: Page }, testInfo) => {
    const scriptPayload = "<script>alert('xss')</script>";
    const sqlPayload = "' OR '1'='1";

    await loginPage.performLogin(scriptPayload, sqlPayload);

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
    await expect(loginPage.loginHeading).toBeVisible();
  });
});
```