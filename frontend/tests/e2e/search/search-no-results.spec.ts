/**
 * @feature Search No Results Feedback
 * @featureFile search-no-results.feature
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
      const searchTerm = generateRandomString([10]);

      // Given I am on the Search Funding Opportunity page
      await page.goto("/search");
      await waitForSearchResultsInitialLoad(page);

      // this is dumb but webkit has an issue with trying to fill in the input too quickly
      // if the expect in here fails, we give it another shot after 5 seconds
      // this way we avoid an arbitrary timeout, and do not slow down the other tests
      try {
        await fillSearchInputAndSubmit(searchTerm, page);
      } catch (_e) {
        await fillSearchInputAndSubmit(searchTerm, page);
      }
      // When I search for an obscure random keyword
      await waitForURLContainsQueryParamValue(page, "query", searchTerm);

      // Then I should see the heading "0 Opportunities"
      const resultsHeading = page.getByRole("heading", {
        name: /0 Opportunities/i,
      });
      await expect(resultsHeading).toBeVisible();

      // And I should see "Your search didn't return any results."
      await expect(
        page.locator("div[data-testid='no-search-results'] h2"),
      ).toHaveText("Your search didn't return any results.");
    },
  );
});
