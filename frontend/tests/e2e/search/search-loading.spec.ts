import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

import { fillSearchInputAndSubmit } from "./searchSpecUtil";

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

  test("should show and hide loading state", async ({
    page,
    browserName,
  }: PageProps) => {
    // TODO (Issue #2005): fix test for webkit
    test.skip(
      browserName === "webkit",
      "Skipping test for WebKit due to a query param issue.",
    );
    const searchTerm = "advanced";
    await fillSearchInputAndSubmit(searchTerm, page);

    const loadingIndicator = page.getByTestId("loading-message");
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    const searchTerm2 = "agency";
    await fillSearchInputAndSubmit(searchTerm2, page);
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();
  });
});
