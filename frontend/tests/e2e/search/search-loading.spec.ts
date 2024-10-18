import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";
import {
  fillSearchInputAndSubmit,
  generateRandomString,
} from "tests/e2e/search/searchSpecUtil";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test.describe("Search page tests", () => {
  test.beforeEach(async ({ page }: PageProps) => {
    // Navigate to the search page with the feature flag set
    await page.goto("/search?_ff=showSearchV0:true");
  });

  test("should show and hide loading state", async ({ page }: PageProps) => {
    // if this doesn't work we can try https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-slow-mo
    const searchTerm = generateRandomString([4, 5]);
    const loadingIndicator = page.getByTestId("loading-message");
    await fillSearchInputAndSubmit(searchTerm, page);
    await Promise.all([expect(loadingIndicator).toBeVisible()]);
    await expect(loadingIndicator).toBeHidden();

    const searchTerm2 = generateRandomString([8]);
    await Promise.all([
      fillSearchInputAndSubmit(searchTerm2, page),
      expect(loadingIndicator).toBeVisible(),
    ]);
    await expect(loadingIndicator).toBeHidden();
  });
});
