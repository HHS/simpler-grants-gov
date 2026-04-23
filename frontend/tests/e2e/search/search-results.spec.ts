/**
 * @feature Search - Results Visibility
 * @featureFile frontend/tests/e2e/search/features/search-core/search-results.feature
 * @scenario Search with a valid term and verify results count and list visibility
 */

import { expect, test } from "@playwright/test";
import { waitForURLContainsQueryParamValue } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";

import {
  fillSearchInputAndSubmit,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, SMOKE, CORE_REGRESSION } = VALID_TAGS;

test.beforeEach(async ({ page }) => {
  // Given a valid search keyword
  const searchTerm = "grants";

  // Given the user is on the search page
  await page.goto("/search");
  await waitForSearchResultsInitialLoad(page);

  // this is dumb but webkit has an issue with trying to fill in the input too quickly
  // if the expect in here fails, we give it another shot after 5 seconds
  // this way we avoid an arbitrary timeout, and do not slow down the other tests
  // When the user submits the valid keyword
  try {
    await fillSearchInputAndSubmit(searchTerm, page);
  } catch (_e) {
    await fillSearchInputAndSubmit(searchTerm, page);
  }

  await waitForURLContainsQueryParamValue(page, "query", searchTerm);
});

test.describe("Search page results tests", () => {
  test(
    "should return at least 1 result when searching with valid term",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, SMOKE] },
    async ({ page }) => {
      // Then the results heading indicates one or more opportunities
      const resultsHeading = page.locator("h3", {
        hasText: /^[1-9]\d*\s+Opportunities$/i,
      });
      await expect(resultsHeading).toBeAttached();
    },
  );

  test(
    "search list should have at least 1 item",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Then the results list contains at least one entry
      const searchList = page.locator("ul.usa-list--unstyled");
      await expect(searchList.locator("li >> nth=1")).toBeAttached();
    },
  );
});
