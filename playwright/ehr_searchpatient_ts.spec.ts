This document presents a comprehensive, production-ready QA Automation architecture built using **Playwright** and **TypeScript**. The framework strictly implements the Page Object Model (POM) design pattern, incorporates dynamic environment handling, follows strict locator strategy priorities, and complies with modern enterprise test automation standards.

---

### 📂 Folder Structure

```text
automation-project/
├── .env
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   └── PatientSearchPage.ts
├── tests/
│   └── patientSearch.spec.ts
└── utils/
    └── envUtils.ts
```

---

### --- Configuration & Dependencies

#### `.env`

```env
# Base Application URL
BASE_URL=https://healthcare-app-qa.example.com

# Test User Data & API Credentials (Required environment configuration)
TEST_EMAIL=qa_automation_user@example.com
```

#### `utils/envUtils.ts`

```typescript
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Utility class to centralize access to environment variables.
 */
export class EnvUtils {
  public static readonly BASE_URL: string = process.env.BASE_URL || 'https://healthcare-app-qa.example.com';
  public static readonly TEST_EMAIL: string = process.env.TEST_EMAIL || 'qa_automation_user@example.com';
}
```

#### `package.json`

```json
{
  "name": "patient-registration-playwright-automation",
  "version": "1.0.0",
  "description": "Enterprise QA Automation Framework for Patient Registration using Playwright and TypeScript",
  "main": "index.js",
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:report": "npx playwright show-report"
  },
  "keywords": [
    "playwright",
    "typescript",
    "qa-automation",
    "testing",
    "page-object-model"
  ],
  "author": "QA Automation Architecture Team",
  "license": "ISC",
  "devDependencies": {
    "@playwright/test": "^1.42.1",
    "@types/node": "^20.11.24",
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
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  expect: {
    timeout: 60000,
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

#### `pages/BasePage.ts`

```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * Abstract BasePage providing reusable helper functions and standard explicit waits.
 */
export abstract class BasePage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to a specific relative or absolute URL.
   * @param url Target endpoint
   */
  public async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Explicit wait ensuring the locator is enabled.
   * @param locator Playwright Locator
   * @param timeout Optional timeout in milliseconds
   */
  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  /**
   * Safely retrieves inner text content of a locator.
   * @param locator Playwright Locator
   */
  public async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Asserts whether a given element is visible on the page.
   * @param locator Playwright Locator
   */
  public async isElementVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }
}
```

#### `pages/PatientSearchPage.ts`

```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object capturing elements and workflows for Patient Search & Duplicate Review.
 */
export class PatientSearchPage extends BasePage {
  // Navigation Locators
  public readonly patientSearchTab: Locator;
  
  // Search Form Locators
  public readonly firstNameInput: Locator;
  public readonly lastNameInput: Locator;
  public readonly dobInput: Locator;
  public readonly searchButton: Locator;

  // Search Results & Message Locators
  public readonly searchResultsTable: Locator;
  public readonly matchingPatientRow: Locator;
  public readonly noRecordsFoundAlert: Locator;
  public readonly firstNameErrorMsg: Locator;
  public readonly lastNameErrorMsg: Locator;
  public readonly dobErrorMsg: Locator;

  // Registration & Duplicate Modal Locators
  public readonly registerNewPatientButton: Locator;
  public readonly duplicateReviewModal: Locator;
  public readonly selectExistingProfileButton: Locator;
  public readonly useSelectedProfileButton: Locator;
  public readonly cancelDuplicateModalButton: Locator;

  constructor(page: Page) {
    super(page);

    // Priority 1: getByRole & Priority 3: getByLabel / getByPlaceholder
    this.patientSearchTab = page.getByRole('link', { name: 'Patient Search' });
    this.firstNameInput = page.getByRole('textbox', { name: 'First Name' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last Name' });
    this.dobInput = page.getByLabel('Date of Birth');
    this.searchButton = page.getByRole('button', { name: 'Search' });

    // Results & Messages
    this.searchResultsTable = page.getByRole('table', { name: 'Patient Search Results' });
    this.matchingPatientRow = page.getByTestId('patient-record-row');
    this.noRecordsFoundAlert = page.getByText('No matching records found');
    this.firstNameErrorMsg = page.getByTestId('first-name-error');
    this.lastNameErrorMsg = page.getByTestId('last-name-error');
    this.dobErrorMsg = page.getByTestId('dob-error');

    // Duplicate Prompt & Navigation
    this.registerNewPatientButton = page.getByRole('button', { name: 'Proceed to Register New Patient' });
    this.duplicateReviewModal = page.getByRole('dialog', { name: 'Potential Duplicate Found' });
    this.selectExistingProfileButton = page.getByRole('button', { name: 'View Existing Profile' });
    this.useSelectedProfileButton = page.getByRole('button', { name: 'Use Selected Profile' });
    this.cancelDuplicateModalButton = page.getByRole('button', { name: 'Cancel' });
  }

  /**
   * Navigates to the Patient Search module under Registration.
   */
  public async openPatientSearchModule(): Promise<void> {
    await this.patientSearchTab.click();
    await expect(this.firstNameInput).toBeVisible();
  }

  /**
   * Inputs patient search criteria and executes search.
   */
  public async searchPatient(firstName: string, lastName: string, dob: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.dobInput.fill(dob);
    await this.searchButton.click();
  }

  /**
   * Initiates the new patient registration workflow from search screen.
   */
  public async clickRegisterNewPatient(): Promise<void> {
    await this.waitForEnabled(this.registerNewPatientButton);
    await this.registerNewPatientButton.click();
  }

  /**
   * Selects an existing record from the duplicate review modal.
   */
  public async selectExistingRecordFromDuplicatePrompt(): Promise<void> {
    await expect(this.duplicateReviewModal).toBeVisible();
    await this.selectExistingProfileButton.click();
    await this.useSelectedProfileButton.click();
  }
}
```

---

### --- Test Implementation

#### `tests/patientSearch.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';
import { EnvUtils } from '../utils/envUtils';
import { PatientSearchPage } from '../pages/PatientSearchPage';

test.describe('Patient Registration - Patient Search & Duplicate Review Module', () => {
  let patientSearchPage: PatientSearchPage;

  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to base application URL before each test case
    await page.goto(EnvUtils.BASE_URL);
    patientSearchPage = new PatientSearchPage(page);
    await patientSearchPage.openPatientSearchModule();
  });

  test('TC-TS-001-001: Verify exact match search on First Name, Last Name, and DOB displays matching record and duplicate prompt', async ({ page }, testInfo) => {
    const firstName = 'John';
    const lastName = 'Doe';
    const dob = '01/15/1985';

    await patientSearchPage.searchPatient(firstName, lastName, dob);

    // Verify search results table displays matching patient record
    await expect(patientSearchPage.searchResultsTable).toBeVisible();
    await expect(patientSearchPage.matchingPatientRow).toContainText(firstName);
    await expect(patientSearchPage.matchingPatientRow).toContainText(lastName);

    // Proceed to register new patient using exact same details
    await patientSearchPage.clickRegisterNewPatient();

    // Verify system presents duplicate review prompt modal
    await expect(patientSearchPage.duplicateReviewModal).toBeVisible();
    await expect(patientSearchPage.duplicateReviewModal).toContainText('Potential Duplicate Found');
  });

  test('TC-TS-001-003: Verify search behavior when Date of Birth differs for matching First and Last Name', async ({ page }, testInfo) => {
    const firstName = 'John';
    const lastName = 'Doe';
    const nonMatchingDob = '01/15/1999';

    await patientSearchPage.searchPatient(firstName, lastName, nonMatchingDob);

    // Verify exact duplicate criteria is not triggered
    await expect(patientSearchPage.duplicateReviewModal).not.toBeVisible();
  });

  test('TC-TS-002-001: Verify Patient Search with Non-Existent Parameters Displays No Records Found and Enables New Registration', async ({ page }, testInfo) => {
    await patientSearchPage.searchPatient('JohnX', 'DoeY', '01/01/2099');

    // Verify no records message is displayed
    await expect(patientSearchPage.noRecordsFoundAlert).toBeVisible();

    // Verify new patient registration option is directly enabled
    await expect(patientSearchPage.registerNewPatientButton).toBeEnabled();
  });

  test('TC-TS-003-001: Verify selection of existing patient record from duplicate review prompt during registration', async ({ page }, testInfo) => {
    await patientSearchPage.searchPatient('Robert', 'Smith', '04/12/1980');
    await patientSearchPage.clickRegisterNewPatient();

    // Handle potential duplicate prompt
    await patientSearchPage.selectExistingRecordFromDuplicatePrompt();

    // Verify duplicate review prompt closes and existing patient profile is active
    await expect(patientSearchPage.duplicateReviewModal).not.toBeVisible();
    await expect(page).toHaveURL(/.*patient\/profile/);
  });

  test('TC-TS-004-001: Verify validation message when submitting search with all mandatory search fields left completely blank', async ({ page }, testInfo) => {
    // Click Search without entering any parameters
    await patientSearchPage.searchButton.click();

    // Assert field-level validation messages appear
    await expect(patientSearchPage.firstNameErrorMsg).toBeVisible();
    await expect(patientSearchPage.lastNameErrorMsg).toBeVisible();
  });

  test('TC-TS-005-001: Verify patient duplicate search response time is under 2 seconds for exact demographic matches', async ({ page }, testInfo) => {
    const startTime = Date.now();

    await patientSearchPage.searchPatient('John', 'Doe', '01/15/1980');
    await expect(patientSearchPage.searchResultsTable).toBeVisible();

    const executionTime = Date.now() - startTime;
    
    // Assert response time SLA is under 2000 ms (2 seconds)
    expect(executionTime).toBeLessThan(2000);
  });
});
```