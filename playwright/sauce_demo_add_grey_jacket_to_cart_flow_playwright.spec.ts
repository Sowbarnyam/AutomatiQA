import { test } from '@playwright/test';
import { MainPage } from '../pages/MainPage';

test.describe('Sauce Demo - Add Grey Jacket to Cart Flow', () => {
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
  });

  test('should add grey jacket to cart and proceed to cart page', async () => {
    await mainPage.navigateToMainPage();
    await mainPage.selectGreyJacket();
    await mainPage.verifyGreyJacketHeadingVisible();
    await mainPage.addToCart();
    await mainPage.openCart();
    await mainPage.verifyCartUrl();
  });
});