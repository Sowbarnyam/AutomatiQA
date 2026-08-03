This document presents a production-ready, enterprise-grade QA Automation Framework built using **Playwright** and **TypeScript**. The architecture strictly follows the **Page Object Model (POM)** design pattern, incorporating object-oriented design principles, robust explicit waiting mechanisms, complete type safety, environment configuration, and clean test separation.

---

### 📂 Folder Structure

```
automation-project/
├── .env
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   └── PaginationPage.ts
├── tests/
│   └── pagination.spec.ts
└── utils/
    └── envUtils.ts
```

---

### --- Configuration & Dependencies

#### File: `.env`
```env
# Application Base URL
BASE_URL=https://example.com/records

# Test User Credentials
TEST_EMAIL=qa_automation_user@example.com
```

#### File: `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Utility class to manage and expose environment configurations securely.
 */
export class EnvUtils {
  public static readonly BASE_URL: string = process.env.BASE_URL || 'https://example.com/records';
  public static readonly TEST_EMAIL: string = process.env.TEST_EMAIL || 'qa_automation_user@example.com';
}
```

#### File: `package.json`
```json
{
  "name": "playwright-typescript-framework",
  "version": "1.0.0",
  "description": "Production-grade enterprise QA automation framework built with Playwright and TypeScript",
  "main": "index.js",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "keywords": [
    "playwright",
    "typescript",
    "automation",
    "qa",
    "testing",
    "pom"
  ],
  "author": "Senior QA Architect",
  "license": "ISC",
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "dotenv": "^16.3.1",
    "typescript": "^5.3.0"
  }
}
```

#### File: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';
import { EnvUtils } from './utils/envUtils';
import path from 'path';

const runId = new Date().getTime();
const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  timeout: 180000,
  expect: {
    timeout: 60000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: 'test-results/run-' + runId,
  reporter: [
    ['html', { outputFolder: 'playwright-report/run-' + runId }]
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
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

---

### --- Page Object Model (POM)

#### File: `pages/BasePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * Abstract BasePage providing core wrapper methods and shared functionality for all Page Objects.
 */
export abstract class BasePage {
  /**
   * Public Playwright Page object.
   */
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to the specified path or URL.
   * @param path Target path or URL
   */
  public async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Clicks on an element after ensuring it is enabled.
   * @param locator Target Locator
   */
  public async clickElement(locator: Locator): Promise<void> {
    await this.waitForEnabled(locator);
    await locator.click();
  }

  /**
   * Fills text into an input field using Playwright fill API.
   * @param locator Target Locator
   * @param value Text value to input
   */
  public async fillField(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  /**
   * Retrieves text content from a locator securely.
   * @param locator Target Locator
   */
  public async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Explicitly waits until a locator is enabled.
   * @param locator Target Locator
   * @param timeout Optional timeout override
   */
  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  /**
   * Checks if an element is currently visible on the page.
   * @param locator Target Locator
   */
  public async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }
}
```

#### File: `pages/PaginationPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object encapsulating pagination component elements and actions.
 */
export class PaginationPage extends BasePage {
  public readonly itemsPerPageDropdown: Locator;
  public readonly summaryText: Locator;
  public readonly nextPageButton: Locator;
  public readonly previousPageButton: Locator;
  public readonly activePageIndicator: Locator;
  public readonly pageInput: Locator;
  public readonly jumpButton: Locator;
  public readonly tableRows: Locator;
  public readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.itemsPerPageDropdown = page.getByRole('combobox', { name: 'Items per page' });
    this.summaryText = page.getByTestId('pagination-summary');
    this.nextPageButton = page.getByRole('button', { name: 'Next Page' });
    this.previousPageButton = page.getByRole('button', { name: 'Previous Page' });
    this.activePageIndicator = page.getByTestId('active-page');
    this.pageInput = page.getByRole('spinbutton', { name: 'Page number' });
    this.jumpButton = page.getByRole('button', { name: 'Go' });
    this.tableRows = page.locator('table tbody tr');
    this.errorMessage = page.getByRole('alert');
  }

  /**
   * Selects a page size option from the items-per-page dropdown.
   * @param pageSize Page size string value (e.g., '10', '25', '50')
   */
  public async selectItemsPerPage(pageSize: string): Promise<void> {
    await this.itemsPerPageDropdown.selectOption(pageSize);
  }

  /**
   * Gets the current summary text display.
   */
  public async getSummaryText(): Promise<string> {
    return await this.getText(this.summaryText);
  }

  /**
   * Clicks the Next Page button.
   */
  public async clickNextPage(): Promise<void> {
    await this.clickElement(this.nextPageButton);
  }

  /**
   * Clicks the Previous Page button.
   */
  public async clickPreviousPage(): Promise<void> {
    await this.clickElement(this.previousPageButton);
  }

  /**
   * Retrieves the active page indicator number text.
   */
  public async getActivePageNumber(): Promise<string> {
    return await this.getText(this.activePageIndicator);
  }

  /**
   * Inputs a value into the direct page jump field.
   * @param pageNumber Target page number string
   */
  public async enterPageNumber(pageNumber: string): Promise<void> {
    await this.fillField(this.pageInput, pageNumber);
  }

  /**
   * Submits the page jump field using the Enter key.
   * @param pageNumber Target page number string
   */
  public async jumpToPage(pageNumber: string): Promise<void> {
    await this.enterPageNumber(pageNumber);
    await this.pageInput.press('Enter');
  }

  /**
   * Retrieves the count of visible records in the table grid.
   */
  public async getTableRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Retrieves validation or error message text if visible.
   */
  public async getErrorMessageText(): Promise<string> {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return '';
  }
}
```

---

### --- Test Implementation

#### File: `tests/pagination.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { PaginationPage } from '../pages/PaginationPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Pagination Module Functional & Validation Tests', () => {
  let paginationPage: PaginationPage;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto(EnvUtils.BASE_URL);
    paginationPage = new PaginationPage(page);
  });

  test('TC-IMG-001: Verify Pagination Controls Display and Default Page Summary', async ({ page }: { page: Page }, testInfo) => {
    await expect(paginationPage.itemsPerPageDropdown).toBeVisible();
    await expect(paginationPage.summaryText).toBeVisible();
    await expect(paginationPage.nextPageButton).toBeVisible();
    await expect(paginationPage.previousPageButton).toBeVisible();

    const summaryText = await paginationPage.getSummaryText();
    expect(summaryText).not.toBe('');
  });

  test('TC-IMG-002: Verify Page Navigation Using Next and Previous Buttons', async ({ page }: { page: Page }, testInfo) => {
    await paginationPage.clickNextPage();
    let activePage = await paginationPage.getActivePageNumber();
    expect(activePage).toContain('2');

    await paginationPage.clickPreviousPage();
    activePage = await paginationPage.getActivePageNumber();
    expect(activePage).toContain('1');
  });

  test('TC-IMG-003: Verify Boundary and Invalid Input Handling in Direct Page Jump Field', async ({ page }: { page: Page }, testInfo) => {
    const invalidInputs = ['9999', '-5', 'abc@'];

    for (const invalidInput of invalidInputs) {
      await paginationPage.jumpToPage(invalidInput);
      const activePage = await paginationPage.getActivePageNumber();
      expect(activePage).not.toBe(invalidInput);
    }
  });

  test('TC-IMG-004: Verify Changing Items Per Page Updates Table Grid Dynamically', async ({ page }: { page: Page }, testInfo) => {
    await paginationPage.selectItemsPerPage('25');
    const rowCount = await paginationPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(25);
  });
});
```