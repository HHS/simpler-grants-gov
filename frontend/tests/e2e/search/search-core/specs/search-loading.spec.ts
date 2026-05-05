/**
 * @feature Search - Loading State
 * @featureFile e2e/search/search-core/features/search-loading.feature
 * @scenario Loading indicator appears and disappears for each search in a session
 */
import { expect, test } from "@playwright/test";
import { chromium } from "playwright-core";
import { generateRandomString } from "tests/e2e/playwrightUtils";
import { fillSearchInputAndSubmit } from "tests/e2e/search/searchSpecUtil";

test.describe("Search page loading state", () => {
  // Scenario: Loading indicator appears and disappears for each search in a session
  test.skip("should show and hide loading state", async () => {
    // Given I am on the "Search funding opportunity" page
    const searchTerm = generateRandomString([4, 5]);
    const searchTerm2 = generateRandomString([8]);

    const browser = await chromium.launch({ slowMo: 100 });

    const page = await browser.newPage();
    await page.goto("/search");
    const loadingIndicator = page.locator(
      'span[data-testid="loading-message"]',
    );

    // When I search for "<search term-1>"
    await fillSearchInputAndSubmit(searchTerm, page);
    // Then the loading indicator should appear
    await expect(loadingIndicator).toBeVisible();
    // And the loading indicator should disappear after results load
    await expect(loadingIndicator).toBeHidden();

    // When I search for another "<search term-2>"
    await fillSearchInputAndSubmit(searchTerm2, page);
    // Then the loading indicator should appear
    await expect(loadingIndicator).toBeVisible();
    // And the loading indicator should disappear after results load
    await expect(loadingIndicator).toBeHidden();
  });
});
