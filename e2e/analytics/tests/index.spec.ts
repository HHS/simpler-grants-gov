import { Page, expect, test } from '@playwright/test';

import AxeBuilder from '@axe-core/playwright';

test.describe('Generic Webpage Tests', () => {
  test('should load the webpage successfully', async ({ page }) => {
    const response = await page.goto('/');
    const title = await page.title();
    expect(response!.status()).toBe(200);
  });

  test('should take a screenshot of the webpage', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'example-screenshot.png', fullPage: true });
  });

  // https://playwright.dev/docs/accessibility-testing
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Example test of finding a an html element on the index/home page
  // test('should check for an element to be visible', async ({ page }) => {
  //   await page.goto('/');
  //   const element = page.locator('h1');
  //   await expect(element).toBeVisible();
  // });
});
