This document presents an enterprise-grade, production-ready QA Automation framework built with **Playwright** and **TypeScript**. The framework adheres strictly to the **Page Object Model (POM)** pattern, emphasizing high reliability, clean execution, modularity, and strict security compliance for credential management and state persistence.

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
│   ├── HeaderPage.ts
│   ├── HomePage.ts
│   ├── CalculatorPage.ts
│   ├── ProductDetailPage.ts
│   ├── LeadGenPage.ts
│   └── LoanApplicationPage.ts
├── tests/
│   ├── auth.setup.ts
│   ├── login.spec.ts
│   ├── header.spec.ts
│   ├── home.spec.ts
│   ├── calculators.spec.ts
│   ├── product-detail.spec.ts
│   ├── lead-generation.spec.ts
│   └── loan-application.spec.ts
└── utils/
    └── envUtils.ts
```

---

### --- Configuration & Dependencies

#### `.env`
```env
BASE_URL=https://www.bajajhousingfinance.in
TEST_EMAIL=customer.standard@example.com
TEST_PASSWORD=SecurePassword123!
BYPASS_KEY=GLOBAL_BYPASS_2026
```

#### `package.json`
```json
{
  "name": "playwright-ts-automation-framework",
  "version": "1.0.0",
  "description": "Production-ready Playwright TypeScript QA Automation Framework",
  "main": "index.js",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:chromium": "playwright test --project=chromium",
    "report": "playwright show-report"
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

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');
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

#### `utils/envUtils.ts`
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export class EnvUtils {
  public static readonly BASE_URL = process.env.BASE_URL || 'https://www.bajajhousingfinance.in';
  public static readonly TEST_EMAIL = process.env.TEST_EMAIL || 'customer.standard@example.com';
  public static readonly TEST_PASSWORD = process.env.TEST_PASSWORD || 'SecurePassword123!';
  public static readonly BYPASS_KEY = process.env.BYPASS_KEY || 'GLOBAL_BYPASS_2026';
}
```

---

### --- Page Object Model (POM)

#### `pages/BasePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';

export abstract class BasePage {
  public page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  public async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  public async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  public async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(text);
  }
}
```

#### `pages/LoginPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EnvUtils } from '../utils/envUtils';

export class LoginPage extends BasePage {
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;
  public readonly globalBypassToggle: Locator;
  public readonly bypassKeyInput: Locator;
  public readonly submitButton: Locator;
  public readonly errorMessage: Locator;
  public readonly otpInput: Locator;
  public readonly verifyOtpButton: Locator;
  public readonly resendOtpButton: Locator;
  public readonly successToast: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder('Enter Mobile / Email');
    this.passwordInput = page.getByPlaceholder('Enter Password');
    this.globalBypassToggle = page.getByRole('checkbox', { name: 'Global Login / OTP Bypass' });
    this.bypassKeyInput = page.getByPlaceholder('Enter Global Bypass Key');
    this.submitButton = page.getByRole('button', { name: 'Submit / Login' });
    this.errorMessage = page.locator('.error-message-alert');
    this.otpInput = page.getByPlaceholder('Enter 6-digit OTP');
    this.verifyOtpButton = page.getByRole('button', { name: 'Verify OTP' });
    this.resendOtpButton = page.getByRole('button', { name: 'Resend OTP' });
    this.successToast = page.locator('.toast-success');
  }

  public async loginWithBypass(email: string, bypassKey: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
    if (await this.globalBypassToggle.isVisible()) {
      await this.globalBypassToggle.check();
      await this.fillInput(this.bypassKeyInput, bypassKey);
    }
    await this.clickElement(this.submitButton);
  }

  public async submitInvalidOtp(otp: string): Promise<void> {
    await this.fillInput(this.otpInput, otp);
    await this.clickElement(this.verifyOtpButton);
  }

  public async clickResendOtp(): Promise<void> {
    await this.clickElement(this.resendOtpButton);
  }
}
```

#### `pages/HeaderPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HeaderPage extends BasePage {
  public readonly logo: Locator;
  public readonly productsDropdown: Locator;
  public readonly companyDropdown: Locator;
  public readonly contactUsDropdown: Locator;
  public readonly searchInput: Locator;
  public readonly searchButton: Locator;
  public readonly clearSearchIcon: Locator;
  public readonly loginDropdown: Locator;
  public readonly accessibilityIcon: Locator;
  public readonly languageDropdown: Locator;
  public readonly subMenuOverlay: Locator;
  public readonly subMenuLink: (name: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.getByRole('link', { name: 'Bajaj Housing Finance' });
    this.productsDropdown = page.getByRole('button', { name: 'Products' });
    this.companyDropdown = page.getByRole('button', { name: 'Company' });
    this.contactUsDropdown = page.getByRole('button', { name: 'Contact Us' });
    this.searchInput = page.getByPlaceholder('Search');
    this.searchButton = page.getByRole('button', { name: 'Search Icon' });
    this.clearSearchIcon = page.locator('.search-clear-icon');
    this.loginDropdown = page.getByRole('button', { name: 'Login' });
    this.accessibilityIcon = page.locator('.accessibility-icon');
    this.languageDropdown = page.getByRole('button', { name: 'Language' });
    this.subMenuOverlay = page.locator('.header-submenu-container');
    this.subMenuLink = (name: string) => page.getByRole('link', { name });
  }

  public async executeSearch(keyword: string): Promise<void> {
    await this.fillInput(this.searchInput, keyword);
    await this.clickElement(this.searchButton);
  }

  public async hoverDropdown(menu: Locator): Promise<void> {
    await menu.hover();
  }
}
```

#### `pages/HomePage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  public readonly heroBanner: Locator;
  public readonly nextSlideButton: Locator;
  public readonly prevSlideButton: Locator;
  public readonly paginationDots: Locator;
  public readonly activeSlide: Locator;
  public readonly activeCtaButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heroBanner = page.locator('.hero-banner-carousel');
    this.nextSlideButton = page.getByRole('button', { name: 'Next Slide' });
    this.prevSlideButton = page.getByRole('button', { name: 'Previous Slide' });
    this.paginationDots = page.locator('.carousel-pagination-dot');
    this.activeSlide = page.locator('.carousel-slide.active');
    this.activeCtaButton = page.locator('.carousel-slide.active').getByRole('button');
  }

  public async clickPaginationDot(index: number): Promise<void> {
    await this.paginationDots.nth(index - 1).click();
  }
}
```

#### `pages/CalculatorPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CalculatorPage extends BasePage {
  public readonly homeLoanCalcIcon: Locator;
  public readonly emiCalcIcon: Locator;
  public readonly eligibilityCalcIcon: Locator;
  public readonly seeAllLink: Locator;
  public readonly principalInput: Locator;
  public readonly interestRateInput: Locator;
  public readonly tenureInput: Locator;
  public readonly monthlyEmiResult: Locator;
  public readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.homeLoanCalcIcon = page.getByRole('link', { name: 'Home Loan Calculator' });
    this.emiCalcIcon = page.getByRole('link', { name: 'EMI Calculator' });
    this.eligibilityCalcIcon = page.getByRole('link', { name: 'Eligibility Calculator' });
    this.seeAllLink = page.getByRole('link', { name: 'See All' });
    this.principalInput = page.getByLabel('Principal Amount');
    this.interestRateInput = page.getByLabel('Interest Rate');
    this.tenureInput = page.getByLabel('Tenure');
    this.monthlyEmiResult = page.locator('.calculated-emi-value');
    this.errorMessage = page.locator('.calc-input-error');
  }

  public async calculateEmi(principal: string, rate: string, tenure: string): Promise<void> {
    await this.fillInput(this.principalInput, principal);
    await this.fillInput(this.interestRateInput, rate);
    await this.fillInput(this.tenureInput, tenure);
  }
}
```

#### `pages/ProductDetailPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  public readonly breadcrumbs: Locator;
  public readonly productTitle: Locator;
  public readonly stickyNav: Locator;
  public readonly overviewTab: Locator;
  public readonly eligibilityTab: Locator;
  public readonly feesTab: Locator;
  public readonly overviewSection: Locator;
  public readonly eligibilitySection: Locator;
  public readonly feesSection: Locator;

  constructor(page: Page) {
    super(page);
    this.breadcrumbs = page.locator('.breadcrumb-navigation');
    this.productTitle = page.locator('.product-header-title');
    this.stickyNav = page.locator('.sticky-sub-nav');
    this.overviewTab = page.getByRole('button', { name: 'Overview' });
    this.eligibilityTab = page.getByRole('button', { name: 'Eligibility' });
    this.feesTab = page.getByRole('button', { name: 'Fees & Charges' });
    this.overviewSection = page.locator('#overview-section');
    this.eligibilitySection = page.locator('#eligibility-section');
    this.feesSection = page.locator('#fees-section');
  }
}
```

#### `pages/LeadGenPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeadGenPage extends BasePage {
  public readonly fullNameInput: Locator;
  public readonly mobileInput: Locator;
  public readonly emailInput: Locator;
  public readonly dobInput: Locator;
  public readonly panInput: Locator;
  public readonly incomeInput: Locator;
  public readonly checkNowButton: Locator;
  public readonly cibilWidgetCheckButton: Locator;
  public readonly cibilModal: Locator;
  public readonly cibilScoreDisplay: Locator;
  public readonly validationError: Locator;

  constructor(page: Page) {
    super(page);
    this.fullNameInput = page.getByPlaceholder('Full Name');
    this.mobileInput = page.getByPlaceholder('Mobile Number');
    this.emailInput = page.getByPlaceholder('Email Address');
    this.dobInput = page.getByPlaceholder('Date of Birth');
    this.panInput = page.getByPlaceholder('PAN Number');
    this.incomeInput = page.getByPlaceholder('Annual Income');
    this.checkNowButton = page.getByRole('button', { name: 'Check Now' });
    this.cibilWidgetCheckButton = page.locator('.cibil-widget').getByRole('button', { name: 'Check Now' });
    this.cibilModal = page.locator('.cibil-verification-modal');
    this.cibilScoreDisplay = page.locator('.cibil-score-value');
    this.validationError = page.locator('.field-validation-error');
  }

  public async submitPreQualifiedOffer(name: string, mobile: string, email: string): Promise<void> {
    await this.fillInput(this.fullNameInput, name);
    await this.fillInput(this.mobileInput, mobile);
    await this.fillInput(this.emailInput, email);
    await this.clickElement(this.checkNowButton);
  }
}
```

#### `pages/LoanApplicationPage.ts`
```typescript
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoanApplicationPage extends BasePage {
  public readonly fullNameInput: Locator;
  public readonly dobInput: Locator;
  public readonly nextStepButton: Locator;
  public readonly prevStepButton: Locator;
  public readonly incomeInput: Locator;
  public readonly fileUploadInput: Locator;
  public readonly submitAppButton: Locator;
  public readonly referenceNumberDisplay: Locator;
  public readonly uploadErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.fullNameInput = page.getByPlaceholder('Applicant Full Name');
    this.dobInput = page.getByPlaceholder('DOB (YYYY-MM-DD)');
    this.nextStepButton = page.getByRole('button', { name: 'Next' });
    this.prevStepButton = page.getByRole('button', { name: 'Previous' });
    this.incomeInput = page.getByPlaceholder('Monthly Income');
    this.fileUploadInput = page.locator('input[type="file"]');
    this.submitAppButton = page.getByRole('button', { name: 'Submit Application' });
    this.referenceNumberDisplay = page.locator('.application-ref-number');
    this.uploadErrorMessage = page.locator('.file-upload-error');
  }

  public async uploadDocument(filePath: string): Promise<void> {
    await this.fileUploadInput.setInputFiles(filePath);
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

setup('Authenticate Global User Session', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigateTo(EnvUtils.BASE_URL);
  
  if (await loginPage.emailInput.isVisible()) {
    await loginPage.loginWithBypass(EnvUtils.TEST_EMAIL, EnvUtils.BYPASS_KEY);
  }
  
  await page.context().storageState({ path: authFile });
});
```

#### `tests/login.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Customer Portal Authentication Suite', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateTo(EnvUtils.BASE_URL);
  });

  test('TC-TS-014-001 - Login using Global Login bypass mechanism', async ({ page }, testInfo) => {
    await loginPage.loginWithBypass(EnvUtils.TEST_EMAIL, EnvUtils.BYPASS_KEY);
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-TS-014-002 - Authentication failure with invalid Global Login bypass key', async ({ page }, testInfo) => {
    await loginPage.loginWithBypass(EnvUtils.TEST_EMAIL, 'INVALID_BYPASS_KEY');
    await expect(loginPage.errorMessage).toContainText('Invalid or Expired Global Login Bypass Key');
  });

  test('TC-TS-015-001 - Error message display on entering incorrect OTP', async ({ page }, testInfo) => {
    await loginPage.submitInvalidOtp('000000');
    await expect(loginPage.errorMessage).toContainText('Invalid OTP');
    await expect(loginPage.resendOtpButton).toBeVisible();
  });

  test('TC-TS-015-003 - UI error clearing upon requesting new OTP', async ({ page }, testInfo) => {
    await loginPage.submitInvalidOtp('000000');
    await loginPage.clickResendOtp();
    await expect(loginPage.errorMessage).not.toBeVisible();
    await expect(loginPage.successToast).toContainText('New OTP sent successfully');
  });
});
```

#### `tests/header.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { HeaderPage } from '../pages/HeaderPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Header Navigation & Global Search Suite', () => {
  let headerPage: HeaderPage;

  test.beforeEach(async ({ page }) => {
    headerPage = new HeaderPage(page);
    await headerPage.navigateTo(EnvUtils.BASE_URL);
  });

  test('TC-TS-001-001 - Visual Rendering of Header Navigation Elements', async ({ page }, testInfo) => {
    await expect(headerPage.logo).toBeVisible();
    await expect(headerPage.productsDropdown).toBeVisible();
    await expect(headerPage.companyDropdown).toBeVisible();
    await expect(headerPage.contactUsDropdown).toBeVisible();
    await expect(headerPage.searchInput).toBeVisible();
    await expect(headerPage.loginDropdown).toBeVisible();
  });

  test('TC-TS-001-003 - Header Search Bar Execution', async ({ page }, testInfo) => {
    await headerPage.executeSearch('Home Loan Interest Rates');
    await expect(page).toHaveURL(/.*search/);
  });

  test('TC-TS-001-004 - Header Search Bar Sanitization of Special Characters', async ({ page }, testInfo) => {
    await headerPage.executeSearch('<script>alert("XSS")</script>');
    await expect(page.locator('.no-results-message')).toBeVisible();
  });

  test('TC-TS-003-003 - Search Input Clear Button UI Interaction', async ({ page }, testInfo) => {
    await headerPage.fillInput(headerPage.searchInput, '4K Monitor');
    await expect(headerPage.clearSearchIcon).toBeVisible();
    await headerPage.clickElement(headerPage.clearSearchIcon);
    await expect(headerPage.searchInput).toHaveValue('');
  });
});
```

#### `tests/home.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Homepage & Hero Banner Suite', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateTo(EnvUtils.BASE_URL);
  });

  test('TC-TS-004-001 - Hero Banner Carousel Initial Rendering', async ({ page }, testInfo) => {
    await expect(homePage.heroBanner).toBeVisible();
    await expect(homePage.activeSlide).toBeVisible();
  });

  test('TC-TS-004-002 - Hero Banner Slide Transitions via Controls', async ({ page }, testInfo) => {
    await homePage.clickElement(homePage.nextSlideButton);
    await expect(homePage.activeSlide).toBeVisible();
    await homePage.clickElement(homePage.prevSlideButton);
    await expect(homePage.activeSlide).toBeVisible();
  });

  test('TC-TS-004-003 - Slide Transition using Pagination Dots', async ({ page }, testInfo) => {
    await homePage.clickPaginationDot(2);
    await expect(homePage.paginationDots.nth(1)).toHaveClass(/active/);
  });

  test('TC-TS-005-001 - Apply Now Redirection from Active Hero Slide', async ({ page }, testInfo) => {
    await homePage.clickElement(homePage.activeCtaButton);
    await expect(page).toHaveURL(/.*apply/);
  });
});
```

#### `tests/calculators.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Financial Calculators Suite', () => {
  let calcPage: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calcPage = new CalculatorPage(page);
    await calcPage.navigateTo(EnvUtils.BASE_URL);
  });

  test('TC-TS-006-001 - Quick-Link Icons Functionality', async ({ page }, testInfo) => {
    await expect(calcPage.homeLoanCalcIcon).toBeVisible();
    await expect(calcPage.emiCalcIcon).toBeVisible();
  });

  test('TC-TS-006-002 - See All Link Redirection', async ({ page }, testInfo) => {
    await calcPage.clickElement(calcPage.seeAllLink);
    await expect(page).toHaveURL(/.*calculators/);
  });

  test('TC-TS-007-001 - Dynamic EMI Calculation on Input Editing', async ({ page }, testInfo) => {
    await calcPage.clickElement(calcPage.emiCalcIcon);
    await calcPage.calculateEmi('500000', '8.5', '20');
    await expect(calcPage.monthlyEmiResult).not.toBeEmpty();
  });

  test('TC-TS-007-003 - Calculator Validation on Negative/Invalid Inputs', async ({ page }, testInfo) => {
    await calcPage.clickElement(calcPage.emiCalcIcon);
    await calcPage.calculateEmi('-10000', '0', '-5');
    await expect(calcPage.errorMessage).toBeVisible();
  });
});
```

#### `tests/product-detail.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Product Detail Page Navigation & Features', () => {
  let productPage: ProductDetailPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductDetailPage(page);
    await productPage.navigateTo(EnvUtils.BASE_URL + '/products/home-loan');
  });

  test('TC-TS-008-001 - Layout & Breadcrumb Display', async ({ page }, testInfo) => {
    await expect(productPage.breadcrumbs).toBeVisible();
    await expect(productPage.productTitle).toBeVisible();
  });

  test('TC-TS-008-002 - Sticky Sub-Navigation Tab Auto-scrolling', async ({ page }, testInfo) => {
    await productPage.clickElement(productPage.eligibilityTab);
    await expect(productPage.eligibilitySection).toBeInViewport();
  });

  test('TC-TS-008-004 - Navigation to Non-Existent Product Shows 404', async ({ page }, testInfo) => {
    await productPage.navigateTo(EnvUtils.BASE_URL + '/products/invalid-id-9999');
    await expect(page.locator('.not-found-title')).toBeVisible();
  });
});
```

#### `tests/lead-generation.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LeadGenPage } from '../pages/LeadGenPage';
import { EnvUtils } from '../utils/envUtils';

test.describe('Lead Generation & Pre-Qualified Offer Suite', () => {
  let leadPage: LeadGenPage;

  test.beforeEach(async ({ page }) => {
    leadPage = new LeadGenPage(page);
    await leadPage.navigateTo(EnvUtils.BASE_URL + '/pre-qualified-offers');
  });

  test('TC-TS-010-001 - Error handling on empty mandatory fields submission', async ({ page }, testInfo) => {
    await leadPage.clickElement(leadPage.checkNowButton);
    await expect(leadPage.validationError).toBeVisible();
  });

  test('TC-TS-010-002 - Error validation for invalid 10-digit mobile number', async ({ page }, testInfo) => {
    await leadPage.submitPreQualifiedOffer('John Doe', '12345', 'john@test.com');
    await expect(leadPage.validationError).toContainText('Please enter a valid 10-digit mobile number');
  });

  test('TC-TS-011-001 - Successful CIBIL Score Generation Modal', async ({ page }, testInfo) => {
    await leadPage.clickElement(leadPage.cibilWidgetCheckButton);
    await expect(leadPage.cibilModal).toBeVisible();
    await leadPage.fillInput(leadPage.panInput, 'ABCDE1234F');
    await leadPage.clickElement(leadPage.checkNowButton);
    await expect(leadPage.cibilScoreDisplay).toBeVisible();
  });
});
```

#### `tests/loan-application.spec.ts`
```typescript
import { test, expect, Page } from '@playwright/test';
import { LoanApplicationPage } from '../pages/LoanApplicationPage';
import { EnvUtils } from '../utils/envUtils';
import path from 'path';

test.describe('Multi-Step Loan Application & Document Upload Suite', () => {
  let appPage: LoanApplicationPage;

  test.beforeEach(async ({ page }) => {
    appPage = new LoanApplicationPage(page);
    await appPage.navigateTo(EnvUtils.BASE_URL + '/apply/home-loan');
  });

  test('TC-TS-012-001 - Successful Multi-Step Submission with Document Upload', async ({ page }, testInfo) => {
    await appPage.fillInput(appPage.fullNameInput, 'John Doe');
    await appPage.fillInput(appPage.dobInput, '1990-01-01');
    await appPage.clickElement(appPage.nextStepButton);

    await appPage.fillInput(appPage.incomeInput, '85000');
    await appPage.clickElement(appPage.nextStepButton);

    const validFilePath = path.join(__dirname, '../fixtures/sample_id.pdf');
    await appPage.uploadDocument(validFilePath);
    await appPage.clickElement(appPage.submitAppButton);

    await expect(appPage.referenceNumberDisplay).toBeVisible();
  });

  test('TC-TS-013-001 - Rejection of Unsupported Document File Formats', async ({ page }, testInfo) => {
    await appPage.clickElement(appPage.nextStepButton);
    await appPage.clickElement(appPage.nextStepButton);

    const invalidFilePath = path.join(__dirname, '../fixtures/script.sh');
    await appPage.uploadDocument(invalidFilePath);

    await expect(appPage.uploadErrorMessage).toContainText('Only PDF, JPG, and PNG files are allowed');
  });
});
```