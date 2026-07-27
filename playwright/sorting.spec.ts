This is a production-ready QA Automation framework designed using Playwright and TypeScript. It implements the Page Object Model (POM) pattern, adheres to robust locator strategies, follows strict security practices, and incorporates dynamic route interception for resilience testing.

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

#### `.env`
```env
# Mandatory Application Environment Variables
BASE_URL=https://example.com/data-list
TEST_EMAIL=testuser@example.com
```

#### `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';

dotenv.config();

export class EnvUtils {
    public static readonly BASE_URL: string = process.env.BASE_URL || 'https://example.com/data-list';
    public static readonly TEST_EMAIL: string = process.env.TEST_EMAIL || '';
}
```

#### `package.json`
```json
{
  "name": "automation-project",
  "version": "1.0.0",
  "description": "Production-grade Playwright TypeScript Automation Framework",
  "main": "index.js",
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "report": "npx playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "dotenv": "^16.3.1",
    "typescript": "^5.3.3"
  }
}
```

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';
import { EnvUtils } from './utils/envUtils';
import path from 'path';

const runId = new Date().getTime();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  expect: {
    timeout: 60000
  },
  outputDir: 'test-results/run-' + runId,
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
```

---

### --- Page Object Model (POM)

#### `pages/BasePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * Abstract BasePage encapsulating core Playwright actions, explicit waits,
 * and standard verification utilities.
 */
export abstract class BasePage {
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigates to the specified URL or path.
     * @param path Target path or URL
     */
    public async navigateTo(path: string): Promise<void> {
        await this.page.goto(path);
    }

    /**
     * Clicks on a locator after ensuring it is visible.
     * @param locator Target Playwright Locator
     */
    public async clickElement(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible' });
        await locator.click();
    }

    /**
     * Fills an input field using fill() method.
     * @param locator Target Playwright Locator
     * @param value Text value to input
     */
    public async fillInput(locator: Locator, value: string): Promise<void> {
        await locator.waitFor({ state: 'visible' });
        await locator.fill(value);
    }

    /**
     * Gets trimmed text content from a Locator.
     * @param locator Target Playwright Locator
     */
    public async getText(locator: Locator): Promise<string> {
        await locator.waitFor({ state: 'visible' });
        const text = await locator.textContent();
        return (text || '').trim();
    }

    /**
     * Explicitly waits until the specified locator is enabled.
     * @param locator Target Playwright Locator
     * @param timeout Optional explicit timeout in milliseconds
     */
    public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
        await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
    }
}
```

#### `pages/PaginationPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PaginationPage extends BasePage {
    // Locators strictly prioritize accessibility roles and resilient test-ids
    public readonly dataRecords: Locator;
    public readonly paginationInfo: Locator;
    public readonly currentPageIndicator: Locator;
    public readonly firstPageButton: Locator;
    public readonly previousPageButton: Locator;
    public readonly nextPageButton: Locator;
    public readonly lastPageButton: Locator;
    public readonly pageJumpInput: Locator;
    public readonly pageJumpSubmitButton: Locator;
    public readonly errorAlert: Locator;
    public readonly loadingSpinner: Locator;

    constructor(page: Page) {
        super(page);
        this.dataRecords = page.getByTestId('data-record');
        this.paginationInfo = page.getByTestId('pagination-info');
        this.currentPageIndicator = page.getByTestId('active-page-indicator');
        this.firstPageButton = page.getByRole('button', { name: /first/i });
        this.previousPageButton = page.getByRole('button', { name: /previous|prev/i });
        this.nextPageButton = page.getByRole('button', { name: /next/i });
        this.lastPageButton = page.getByRole('button', { name: /last/i });
        this.pageJumpInput = page.getByRole('spinbutton', { name: /page number/i });
        this.pageJumpSubmitButton = page.getByRole('button', { name: /go|jump/i });
        this.errorAlert = page.getByRole('alert');
        this.loadingSpinner = page.getByTestId('loading-spinner');
    }

    /**
     * Returns total count of rendered records on the current page.
     */
    public async getRecordCount(): Promise<number> {
        await this.dataRecords.first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
        return await this.dataRecords.count();
    }

    /**
     * Returns raw pagination text e.g., "Page 1 of 10 (Total 100 records)".
     */
    public async getPaginationInfoText(): Promise<string> {
        return await this.getText(this.paginationInfo);
    }

    /**
     * Returns active page number from the indicator label.
     */
    public async getCurrentPageNumber(): Promise<string> {
        return await this.getText(this.currentPageIndicator);
    }

    public async clickNext(): Promise<void> {
        await this.clickElement(this.nextPageButton);
    }

    public async clickPrevious(): Promise<void> {
        await this.clickElement(this.previousPageButton);
    }

    public async clickFirst(): Promise<void> {
        await this.clickElement(this.firstPageButton);
    }

    public async clickLast(): Promise<void> {
        await this.clickElement(this.lastPageButton);
    }

    /**
     * Inputs value into the page jump field and submits request.
     */
    public async jumpToPage(pageNumber: string): Promise<void> {
        await this.fillInput(this.pageJumpInput, pageNumber);
        await this.clickElement(this.pageJumpSubmitButton);
    }

    /**
     * Fetches error alert text content displayed on invalid operations or API failure.
     */
    public async getErrorMessage(): Promise<string> {
        return await this.getText(this.errorAlert);
    }
}
```

---

### --- Test Implementation

#### `tests/pagination.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { PaginationPage } from '../pages/PaginationPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Pagination & Data Listing Verification', () => {
    let paginationPage: PaginationPage;

    test.beforeEach(async ({ page }: { page: Page }) => {
        paginationPage = new PaginationPage(page);
        await page.goto(EnvUtils.BASE_URL);
    });

    test('TC-TS-001-001: Verify initial page data loading and accurate total page count display', async ({ page }: { page: Page }, testInfo) => {
        const recordCount = await paginationPage.getRecordCount();
        expect(recordCount).toBeGreaterThan(0);

        const paginationText = await paginationPage.getPaginationInfoText();
        expect(paginationText).toContain('100'); // Validating total records calculation based on dataset
        
        const activePage = await paginationPage.getCurrentPageNumber();
        expect(activePage).toBe('1');
    });

    test('TC-TS-001-002: Verify page navigation flow across first, next, previous, and last controls', async ({ page }: { page: Page }, testInfo) => {
        // Step 1: Click Next
        await paginationPage.clickNext();
        expect(await paginationPage.getCurrentPageNumber()).toBe('2');

        // Step 2: Click Last Page
        await paginationPage.clickLast();
        expect(await paginationPage.getCurrentPageNumber()).toBe('5');

        // Step 3: Click Previous Page
        await paginationPage.clickPrevious();
        expect(await paginationPage.getCurrentPageNumber()).toBe('4');

        // Step 4: Click First Page
        await paginationPage.clickFirst();
        expect(await paginationPage.getCurrentPageNumber()).toBe('1');
    });

    test('TC-TS-001-003: Verify behavior when entering invalid or out-of-bounds page numbers', async ({ page }: { page: Page }, testInfo) => {
        // Out-of-bounds page number submission
        await paginationPage.jumpToPage('9999');

        // Verify validation notification appears and view state is maintained
        const errorMessage = await paginationPage.getErrorMessage();
        expect(errorMessage).toContain('Invalid page number');

        const activePage = await paginationPage.getCurrentPageNumber();
        expect(activePage).toBe('1');
    });

    test('TC-TS-002-001: Verify dynamic page-2 data loading upon clicking Next button without full page refresh', async ({ page }: { page: Page }, testInfo) => {
        let isFullPageReloaded = false;
        page.on('load', () => { isFullPageReloaded = true; });

        // Trigger dynamic API call for Page 2
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/data') && response.status() === 200
        );

        await paginationPage.clickNext();
        await responsePromise;

        expect(isFullPageReloaded).toBe(false);
        expect(await paginationPage.getCurrentPageNumber()).toBe('2');
    });

    test('TC-TS-002-002: Verify Next button behavior and error handling during server response failure', async ({ page }: { page: Page }, testInfo) => {
        // Intercept API call to simulate 500 Internal Server Error
        await page.route('**/api/data*', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Internal Server Error' })
            });
        });

        await paginationPage.clickNext();

        // Verify UI handles error gracefully without breaking state
        const errorMessage = await paginationPage.getErrorMessage();
        expect(errorMessage).toContain('Failed to load page data');
        expect(await paginationPage.getCurrentPageNumber()).toBe('1');
    });

    test('TC-TS-002-003: Verify UI indicators and pagination controls state while transitioning to Page 2', async ({ page }: { page: Page }, testInfo) => {
        // Delay response to capture temporary dynamic spinner state
        await page.route('**/api/data*', async route => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.continue();
        });

        await paginationPage.nextPageButton.click();
        
        // Assert dynamic dynamic loader dynamic indicator state
        await expect(paginationPage.loadingSpinner).toBeVisible();
        await expect(paginationPage.loadingSpinner).toBeHidden();

        // Verify dynamic update of indicators and button states
        await expect(paginationPage.currentPageIndicator).toHaveText('2');
        await expect(paginationPage.previousPageButton).toBeEnabled();
    });
});
```