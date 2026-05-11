/**
 * @feature Search Core Search Behaviors
 * @featureFile e2e/search/search-core/features/search.feature
 * @Scanario: Page resets to 1 after filter change
 * @Scenario: Flipping sort order reverses first and last result positions
 * @Scenario: Result count is unchanged when all statuses are selected
 * @Scenario: Out-of-range page query redirects to the last valid page
 */

import { expect, test } from "@playwright/test";
import { waitForAnyURLChange } from "tests/e2e/playwrightUtils";
import {
  clickAccordionWithTitle,
  clickLastPaginationPage,
  clickPaginationPageNumber,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  getNumberOfOpportunitySearchResults,
  selectSortBy,
  toggleCheckboxes,
  toggleFilterDrawer,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION, CORE_REGRESSION } =
  VALID_TAGS;

test.describe("Search page tests", () => {
  test(
    "Page resets to 1 after filter change",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I am on the "Search funding opportunities" page
      await page.goto("/search?status=none");

      // When I click to go to page 2 of the search results
      await clickPaginationPageNumber(page, 2);

      // Then I should be on page 2
      let currentPageButton = page
        .locator(".usa-pagination__button.usa-current")
        .first();
      await expect(currentPageButton).toHaveAttribute("aria-label", "Page 2");

      // And I check the "Closed" opportunity status filter
      const statusCheckboxes = {
        "status-closed": "closed",
      };

      // When I open the filters
      await toggleFilterDrawer(page);

      // And I select the "Opportunity status" filter category
      await clickAccordionWithTitle(page, "Opportunity status");
      await toggleCheckboxes(page, statusCheckboxes, "status");

      // And I wait for the search results to load with the new filter
      await Promise.all([
        waitForSearchResultsInitialLoad(page),
        waitForFilterOptions(page, "agency"),
      ]);

      // Then the current page should reset to page 1
      currentPageButton = page
        .locator(".usa-pagination__button.usa-current")
        .first();
      await expect(currentPageButton).toHaveAttribute("aria-label", "Page 1");

      // And the URL should include "status=closed"
      await page.waitForURL("search?status=closed");
    },
  );

  test(
    "Flipping sort order reverses first and last result positions",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);

      // Given I am on the "Search funding opportunities" page
      await page.goto("/search");

      // And I wait for the search results to load
      await waitForSearchResultsInitialLoad(page);

      // When I open the sort by dropdown
      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // And I select "Opportunity title (A to Z)" from the sort by dropdown
      await selectSortBy(page, "opportunityTitleAsc", isMobile);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // Then the first result should be alphabetically first by opportunity title
      const firstSearchResultTitle = await getFirstSearchResultTitle(page);

      // Assumption: on mobile, sort options live in the filter drawer.
      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // And I select "Opportunity title (Z to A)" from the sort by dropdown
      await selectSortBy(page, "opportunityTitleDesc", isMobile);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // When I click to go to the last page of results
      await clickLastPaginationPage(page);

      // Then the last result from the previous sort order should now be the first result
      const lastSearchResultTitle = await getLastSearchResultTitle(page);

      expect(firstSearchResultTitle).toBe(lastSearchResultTitle);
    },
  );

  test(
    "Result count is unchanged when all statuses are selected",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // Given I am on the "Search funding opportunities" page
      // And all opportunity status are effectively unselected via status=none
      await page.goto("/search?status=none");

      // Then the total results count is shown in the UI
      const initialSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      // And I check all the opportunity status "Forecasted", "Open", "Closed", "Archived"
      const statusCheckboxes = {
        "status-forecasted": "forecasted",
        "status-open": "posted",
        "status-closed": "closed",
        "status-archived": "archived",
      };

      // When I open the filters
      await toggleFilterDrawer(page);

      // And I select the "Opportunity status" filter category
      await clickAccordionWithTitle(page, "Opportunity status");
      await toggleCheckboxes(page, statusCheckboxes, "status");

      // Then the total results count is same
      const updatedSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      expect(initialSearchResultsCount).toBe(updatedSearchResultsCount);
    },
  );

  test(
    "Out-of-range page query redirects to the last valid page",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // When I navigate to "/search?page=1000000"
      await page.goto("/search?page=1000000");

      await waitForAnyURLChange(page, "/search?page=1000000");

      // Then I should be redirected to the last page of results
      expect(page.url()).toMatch(/search\?page=\d{1,3}/);
    },
  );
});
