import { expect, test } from "@playwright/test";
import { chromium } from "playwright-core";
import {
  fillSearchInputAndSubmit,
  generateRandomString,
} from "tests/e2e/search/searchSpecUtil";

test.describe("Search page tests", () => {
  // test.beforeEach(async ({ page }: { page: Page }) => {
  //   // Navigate to the search page with the feature flag set
  //   await page.goto("/search?_ff=showSearchV0:true");
  // });

  test("should show and hide loading state", async () => {
    const browser = await chromium.launch({ slowMo: 100 });
    const page = await browser.newPage();
    await page.goto("/search?_ff=showSearchV0:true");
    // if this doesn't work we can try https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-slow-mo
    const searchTerm = generateRandomString([4, 5]);
    const loadingIndicator = page.getByTestId("loading-message");
    // await Promise.all([
    //   fillSearchInputAndSubmit(searchTerm, page),
    //   expect(loadingIndicator).toBeVisible(),
    // ]);

    await fillSearchInputAndSubmit(searchTerm, page);
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    // const searchTerm2 = generateRandomString([8]);
    // await Promise.all([
    //   fillSearchInputAndSubmit(searchTerm2, page),
    //   expect(loadingIndicator).toBeVisible(),
    // ]);
    // await expect(loadingIndicator).toBeHidden();
  });
});
