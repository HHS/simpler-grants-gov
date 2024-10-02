import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

import {
  expectURLContainsQueryParam,
  fillSearchInputAndSubmit,
} from "./searchSpecUtil";

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
});
