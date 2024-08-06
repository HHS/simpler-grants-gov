import { Page, expect, test } from "@playwright/test";
import {
  expectURLContainsQueryParam,
  fillSearchInputAndSubmit,
} from "./searchSpecUtil";

import { BrowserContextOptions } from "playwright-core";

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

  test("should return 0 results when searching for obscure term", async ({
    page,
    browserName,
  }: PageProps) => {
    // TODO (Issue #2005): fix test for webkit
    test.skip(
      browserName === "webkit",
      "Skipping test for WebKit due to a query param issue.",
    );

    const searchTerm = "0resultearch";

    await fillSearchInputAndSubmit(searchTerm, page);
    await new Promise((resolve) => setTimeout(resolve, 3250));
    expectURLContainsQueryParam(page, "query", searchTerm);

    // eslint-disable-next-line testing-library/prefer-screen-queries
    const resultsHeading = page.getByRole("heading", {
      name: /0 Opportunities/i,
    });
    await expect(resultsHeading).toBeVisible();

    await expect(page.locator("div.usa-prose h2")).toHaveText(
      "Your search did not return any results.",
    );
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

    const loadingIndicator = page.locator("text='Loading results...'");
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    const searchTerm2 = "agency";
    await fillSearchInputAndSubmit(searchTerm2, page);
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();
  });
});
