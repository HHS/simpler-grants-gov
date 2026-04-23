/**
 * @feature Search - No Results Feedback
 * @featureFile frontend/tests/e2e/search/features/search-core/search-no-results.feature
 * @scenario Show a zero-results state and helpful no-results message for an obscure search term
 */

import { expect, test } from "@playwright/test";
import {
  generateRandomString,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";

import {
  fillSearchInputAndSubmit,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

test.describe("Search page no results tests", () => {
  test(
    "should return 0 results when searching for obscure term",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given a unique obscure keyword unlikely to match opportunities
      const searchTerm = generateRandomString([10]);

      // Given the user is on the search page
      await page.goto("/search");

      await waitForSearchResultsInitialLoad(page);

      // this is dumb but webkit has an issue with trying to fill in the input too quickly
      // if the expect in here fails, we give it another shot after 5 seconds
      // this way we avoid an arbitrary timeout, and do not slow down the other tests
      // When the user submits the obscure keyword
      try {
        await fillSearchInputAndSubmit(searchTerm, page);
      } catch (_e) {
        await fillSearchInputAndSubmit(searchTerm, page);
      }

      await waitForURLContainsQueryParamValue(page, "query", searchTerm);

      // Then the results area should display zero opportunities and a no-results message
      const resultsHeading = page.getByRole("heading", {
        name: /0 Opportunities/i,
      });
      await expect(resultsHeading).toBeVisible();

      await expect(
        page.locator("div[data-testid='no-search-results'] h2"),
      ).toHaveText("Your search didn't return any results.");
    },
  );
});
