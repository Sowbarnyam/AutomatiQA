This architecture provides a professional, production-ready QA automation framework built with Playwright and TypeScript. It utilizes the Page Object Model (POM) pattern, robust environment variable management, and comprehensive data-driven testing capabilities to ensure scalability and maintainability for your project.

---

### 📂 Folder Structure

```text
automation-project/
├── .env
├── package.json
├── playwright.config.ts
├── data/
│   └── testData.json
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── UserManagementPage.ts
├── tests/
│   ├── login.spec.ts
│   └── user-management.spec.ts
└── utils/
    └── envUtils.ts
```

---

### --- Configuration & Dependencies

#### 1. `.env`
```text
BASE_URL=https://your-app-url.com
TEST_MOBILE=1234567890
TEST_PASSWORD=secure_password_placeholder
```

#### 2. `package.json`
```json
{
  "name": "playwright-automation",
  "version": "1.0.0",
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0",
    "dotenv": "^16.0.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "test": "npx playwright test"
  }
}
```

#### 3. `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';
import { EnvUtils } from './utils/envUtils';
import path from 'path';

const runId = new Date().getTime();
const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  expect: { timeout: 60000 },
  reporter: [['html', { outputFolder: `playwright-report/run-${runId}` }]],
  outputDir: `test-results/run-${runId}`,
  use: {
    baseURL: EnvUtils.BASE_URL,
    actionTimeout: 50000,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});
```

#### 4. `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export class EnvUtils {
  public static readonly BASE_URL = process.env.BASE_URL || '';
  public static readonly TEST_MOBILE = process.env.TEST_MOBILE || '';
  public static readonly TEST_PASSWORD = process.env.TEST_PASSWORD || '';
}
```

---

### --- Page Object Model (POM)

#### 5. `pages/BasePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';

export abstract class BasePage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }
}
```

#### 6. `pages/LoginPage.ts`
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  public readonly usernameInput: Locator = this.page.getByPlaceholder('Mobile Number');
  public readonly passwordInput: Locator = this.page.getByPlaceholder('Password');
  public readonly loginButton: Locator = this.page.getByRole('button', { name: 'Login' });
  public readonly errorMessage: Locator = this.page.locator('.error-message');

  async login(mobile: string, pass: string) {
    await this.usernameInput.fill(mobile);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }
}
```

---

### --- Test Implementation

#### 7. `data/testData.json`
```json
[
  {
    "testCaseId": "TC-MAN-UP-5276-0",
    "description": "Valid login with bypass",
    "mobile": "1234567890",
    "password": "validPassword",
    "shouldPass": true
  },
  {
    "testCaseId": "TC-MAN-UP-5276-1",
    "description": "Invalid password",
    "mobile": "1234567890",
    "password": "wrongPassword",
    "shouldPass": false
  }
]
```

#### 8. `tests/login.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnvUtils } from '../utils/envUtils';
const testData = require('../data/testData.json');

test.describe('Login Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EnvUtils.BASE_URL);
  });

  testData.forEach((data: any) => {
    test(`${data.testCaseId} - ${data.description}`, async ({ page }, testInfo) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(data.mobile, data.password);
      
      if (data.shouldPass) {
        await expect(page).toHaveURL(/.*dashboard/);
      } else {
        await expect(loginPage.errorMessage).toBeVisible();
      }
    });
  });
});
```