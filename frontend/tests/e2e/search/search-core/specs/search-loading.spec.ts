/**
 * @feature Search - Loading State
 * @featureFile e2e/search/search-core/features/search-loading.feature
 * @scenario Show and hide loading indicator on search
 */
import { expect, test } from "@playwright/test";
import { chromium } from "playwright-core";
import { generateRandomString } from "tests/e2e/playwrightUtils";
import { fillSearchInputAndSubmit } from "tests/e2e/search/searchSpecUtil";

test.describe("Search page loading state", () => {
  // Scenario: Show and hide loading indicator on search
  test.skip("should show and hide loading state", async () => {
    // Given I am on the "Search funding opportunity" page
    const searchTerm = generateRandomString([4, 5]);
    const searchTerm2 = generateRandomString([8]);

    const browser = await chromium.launch({ slowMo: 100 });

    const page = await browser.newPage();
    await page.goto("/search");
    // When I submit a search term
    const loadingIndicator = page.locator(
      'span[data-testid="loading-message"]',
    );

    await fillSearchInputAndSubmit(searchTerm, page);
    // Then the loading indicator should be visible, then hidden
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    // When I submit another search term
    await fillSearchInputAndSubmit(searchTerm2, page);
    // Then the loading indicator should be visible, then hidden again
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();
  });
});
