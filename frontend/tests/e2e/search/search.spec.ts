/**
 * @feature Search - Core Search Behaviors
 * @featureFile search-core-behaviors.feature
 * @scenario Validate search pagination, sorting, filter behavior, and page-boundary handling
 */

import { expect, test } from "@playwright/test";
import {
  refreshPageWithCurrentURL,
  waitForAnyURLChange,
} from "tests/e2e/playwrightUtils";
import {
  clickAccordionWithTitle,
  clickLastPaginationPage,
  clickPaginationPageNumber,
  expectCheckboxIDIsChecked,
  expectSortBy,
  fillSearchInputAndSubmit,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  getNumberOfOpportunitySearchResults,
  getSearchInput,
  selectSortBy,
  toggleCheckboxes,
  toggleFilterDrawer,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION, CORE_REGRESSION } =
  VALID_TAGS;
const searchTerm = "education";
const statusCheckboxes = {
  "status-closed": "closed",
};
const fundingInstrumentCheckboxes = {
  "funding-instrument-other": "other",
  "funding-instrument-grant": "grant",
};

const eligibilityCheckboxes = {
  "eligibility-state_governments": "state_governments",
  "eligibility-county_governments": "county_governments",
};
const categoryCheckboxes = {
  "category-recovery_act": "recovery_act",
  "category-agriculture": "agriculture",
};

test.describe("Search page tests", () => {
  // This test has been split out into multiple individual tests in the search-state-persistence file
  // Scenario: Refresh and retain filters and sort order with search term and multiple filters
  test.skip("should refresh and retain filters in a new tab", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    const agencyCheckboxes: { [key: string]: string } = {};
    // Given I am on the Search Funding Opportunity page
    await page.goto("/search");

    // And I wait for the search results to load
    await waitForSearchResultsInitialLoad(page);

    // When I enter "education" in the search input and submit
    await fillSearchInputAndSubmit(searchTerm, page, project.name);

    // And I open the filters
    if (isMobile) {
      await toggleFilterDrawer(page);
    }

    // And I select "Award maximum (Highest)" from the sort by dropdown
    await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);

    // Then the search results should be sorted by "Award maximum (Highest)"
    await expectSortBy(page, "awardCeilingDesc", isMobile);

    // And I open the filters
    if (!isMobile) {
      await toggleFilterDrawer(page);
    }

    // And I wait for the filters to load
    await waitForFilterOptions(page, "agency");

    // And I select the "Opportunity status" filter category
    await toggleCheckboxes(
      page,
      statusCheckboxes,
      "status",
      "forecasted,posted",
    );

    // And I select the "Funding instrument" filter category
    await clickAccordionWithTitle(page, "Funding instrument");

    // And I check the "Other" and "Grant" funding instrument filters
    await toggleCheckboxes(
      page,
      fundingInstrumentCheckboxes,
      "fundingInstrument",
    );

    // And I select the "Eligibility" filter category
    await clickAccordionWithTitle(page, "Eligibility");

    // And I check the "State governments" and "County governments" eligibility filters
    await toggleCheckboxes(page, eligibilityCheckboxes, "eligibility");

    // And I select the "Agency" filter category
    await clickAccordionWithTitle(page, "Agency");
    let agencyId;

    // need to find the first subagency box with an ID that doesn't start with a number
    // targeting checkboxes with ids that start with a number raises issues related
    // to querySelector functionality and what it considers a valid id
    // And I check the first available agency filter with a valid ID
    for (let i = 1; !agencyId || !isNaN(parseInt(agencyId[0])); i++) {
      const subAgency = page
        .locator(
          `div[data-testid='Agency-filter'] > ul > li:nth-child(${i}) ul input`,
        )
        .first();

      const exists = await subAgency.count();

      if (!exists) {
        continue;
      }

      agencyId = await subAgency.getAttribute("id");
    }
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    agencyCheckboxes[agencyId] = agencyId;
    await toggleCheckboxes(page, agencyCheckboxes, "agency");

    // And I select the "Category" filter category
    await clickAccordionWithTitle(page, "Category");

    // And I check the "Recovery Act" and "Agriculture" category filters
    await toggleCheckboxes(page, categoryCheckboxes, "category");

    /***********************************************************/
    /* Page refreshed should have all the same inputs selected
    /***********************************************************/

    // When I refresh the page
    await refreshPageWithCurrentURL(page);

    // And I wait for the search results to load after the refresh
    await waitForSearchResultsInitialLoad(page);

    // Then the sort order should still be "Award maximum (Highest)"
    await expectSortBy(page, "awardCeilingDesc", isMobile);

    // And all the same filters I selected before the refresh should still be selected after the refresh
    const searchInput = getSearchInput(page);

    // And the search input should still have the value "education"
    await expect(searchInput).toHaveValue(searchTerm);

    // When I open the filters
    await toggleFilterDrawer(page);
    for (const [checkboxID] of Object.entries(statusCheckboxes)) {
      // And the "Closed" opportunity status filter should still be selected after the refresh
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(fundingInstrumentCheckboxes)) {
      // And the "Other" and "Grant" funding instrument filters should still be selected after the refresh
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(eligibilityCheckboxes)) {
      // And the "State governments" and "County governments" eligibility filters should still be selected after the refresh
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(agencyCheckboxes)) {
      // And the first available agency filter with a valid ID should still be selected after the refresh
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(categoryCheckboxes)) {
      // And the "Recovery Act" and "Agriculture" category filters should still be selected after the refresh
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
  });

  test(
    "resets page back to 1 when choosing a filter",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Scenario: Page resets to 1 after filter change
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

      await toggleFilterDrawer(page);

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
    "last result becomes first result when flipping sort order",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      // Scenario: Flipping sort order reverses first and last result positions
      // When I open the sorting
      const isMobile = !!project.name.match(/[Mm]obile/);
      await page.goto("/search");

      // And I wait for the search results to load
      await waitForSearchResultsInitialLoad(page);

      if (isMobile) {
        // When I open the filters
        await toggleFilterDrawer(page);
      }
      // And I select "Opportunity title (A to Z)" from the sort by dropdown
      await selectSortBy(page, "opportunityTitleAsc", isMobile);

      if (isMobile) {
        // When I open the filters
        await toggleFilterDrawer(page);
      }
      // Then the first result should be alphabetically first by opportunity title
      const firstSearchResultTitle = await getFirstSearchResultTitle(page);

      if (isMobile) {
        // When I open the filters
        await toggleFilterDrawer(page);
      }
      // And I select "Opportunity title (Z to A)" from the sort by dropdown
      await selectSortBy(page, "opportunityTitleDesc", isMobile);

      if (isMobile) {
        // When I open the filters
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
    "number of results is the same with none or all opportunity status checked",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // Scenario: Result count is unchanged when all statuses are selected
      // When I open the filters
      await page.goto("/search?status=none");
      // And I check all the opportunity status "Any opportunity status"
      const initialSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      // And I check all the opportunity status "Forecasted", "Open", "Closed", "Archived"
      const statusCheckboxes = {
        "status-forecasted": "forecasted",
        "status-open": "posted",
        "status-closed": "closed",
        "status-archived": "archived",
      };

      await toggleFilterDrawer(page);
      await clickAccordionWithTitle(page, "Opportunity status");
      await toggleCheckboxes(page, statusCheckboxes, "status");

      // And I wait for the search results to load with the new filters
      const updatedSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      // Then the total results count is same
      expect(initialSearchResultsCount).toBe(updatedSearchResultsCount);
    },
  );

  test(
    "should redirect to the last page of results when page param is too high",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // Scenario: Out-of-range page query redirects to the last valid page
      // When i navigate to "/search?page=1000000"
      await page.goto("/search?page=1000000");

      // Then I should be redirected to the last page of results
      await waitForAnyURLChange(page, "/search?page=1000000");

      expect(page.url()).toMatch(/search\?page=\d{1,3}/);
    },
  );
});
