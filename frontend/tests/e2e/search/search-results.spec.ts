import { expect, test } from "@playwright/test";

import {
  fillSearchInputAndSubmit,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";
import { waitForURLContainsQueryParamValue } from "../playwrightUtils";

test.beforeEach(async ({ page }) => {
  const searchTerm = "grants";
  await page.goto("/search");
  await waitForSearchResultsInitialLoad(page);

  // this is dumb but webkit has an issue with trying to fill in the input too quickly
  // if the expect in here fails, we give it another shot after 5 seconds
  // this way we avoid an arbitrary timeout, and do not slow down the other tests
  try {
    await fillSearchInputAndSubmit(searchTerm, page);
  } catch (e) {
    await fillSearchInputAndSubmit(searchTerm, page);
  }

  await waitForURLContainsQueryParamValue(page, "query", searchTerm);
});

test.describe("Search page results tests", () => {
  test("should return at least 1 result when searching with valid term", async ({
    page,
  }) => {
    const resultsHeading = page.locator("h3", {
      hasText: /^[1-9]\d*\s+Opportunities$/i,
    });
    await expect(resultsHeading).toBeAttached();
  });

  test("search list should have at least 1 item", async ({ page }) => {
    const searchList = page.locator("ul.usa-list--unstyled");
    await expect(searchList.locator("li >> nth=1")).toBeAttached();
  });
});
