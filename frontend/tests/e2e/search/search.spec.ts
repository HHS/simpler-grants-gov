/**
 * @feature Search - Core Search Behaviors
 * @featureFile frontend/tests/e2e/search/features/search-core/search-core-behaviors.feature
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
  test.skip("should refresh and retain filters in a new tab", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    const agencyCheckboxes: { [key: string]: string } = {};
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page, project.name);
    if (isMobile) {
      await toggleFilterDrawer(page);
    }
    await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);
    await expectSortBy(page, "awardCeilingDesc", isMobile);

    if (!isMobile) {
      await toggleFilterDrawer(page);
    }
    await waitForFilterOptions(page, "agency");

    await toggleCheckboxes(
      page,
      statusCheckboxes,
      "status",
      "forecasted,posted",
    );

    await clickAccordionWithTitle(page, "Funding instrument");
    await toggleCheckboxes(
      page,
      fundingInstrumentCheckboxes,
      "fundingInstrument",
    );

    await clickAccordionWithTitle(page, "Eligibility");
    await toggleCheckboxes(page, eligibilityCheckboxes, "eligibility");

    await clickAccordionWithTitle(page, "Agency");
    let agencyId;

    // need to find the first subagency box with an ID that doesn't start with a number
    // targeting checkboxes with ids that start with a number raises issues related
    // to querySelector functionality and what it considers a valid id
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

    await clickAccordionWithTitle(page, "Category");
    await toggleCheckboxes(page, categoryCheckboxes, "category");

    /***********************************************************/
    /* Page refreshed should have all the same inputs selected
    /***********************************************************/

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    // Expect search inputs are retained in the new tab
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm);

    await toggleFilterDrawer(page);
    for (const [checkboxID] of Object.entries(statusCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(fundingInstrumentCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(eligibilityCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(agencyCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
    for (const [checkboxID] of Object.entries(categoryCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
  });

  test(
    "resets page back to 1 when choosing a filter",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given the user is on page 2 of results
      await page.goto("/search?status=none");
      await clickPaginationPageNumber(page, 2);

      // Verify that page 1 is highlighted
      let currentPageButton = page
        .locator(".usa-pagination__button.usa-current")
        .first();
      await expect(currentPageButton).toHaveAttribute("aria-label", "Page 2");

      // Select the 'Closed' checkbox under 'Opportunity status'
      const statusCheckboxes = {
        "status-closed": "closed",
      };

      // When the user applies a filter
      await toggleFilterDrawer(page);

      await clickAccordionWithTitle(page, "Opportunity status");
      await toggleCheckboxes(page, statusCheckboxes, "status");

      // Wait for the page to reload
      await Promise.all([
        waitForSearchResultsInitialLoad(page),
        waitForFilterOptions(page, "agency"),
      ]);

      // Verify that page 1 is highlighted
      // Then pagination resets to page 1 and URL reflects the selected filter
      currentPageButton = page
        .locator(".usa-pagination__button.usa-current")
        .first();
      await expect(currentPageButton).toHaveAttribute("aria-label", "Page 1");

      // It should not have a page query param set
      await page.waitForURL("search?status=closed");
    },
  );

  test(
    "last result becomes first result when flipping sort order",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      const isMobile = !!project.name.match(/[Mm]obile/);
      // Given the user is on the search page
      await page.goto("/search");

      await waitForSearchResultsInitialLoad(page);

      // When the user changes sort order from ascending to descending
      if (isMobile) {
        await toggleFilterDrawer(page);
      }
      await selectSortBy(page, "opportunityTitleAsc", isMobile);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }
      const firstSearchResultTitle = await getFirstSearchResultTitle(page);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }
      await selectSortBy(page, "opportunityTitleDesc", isMobile);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      await clickLastPaginationPage(page);

      const lastSearchResultTitle = await getLastSearchResultTitle(page);

      // Then the former first result should match the new last-page result
      expect(firstSearchResultTitle).toBe(lastSearchResultTitle);
    },
  );

  test(
    "number of results is the same with none or all opportunity status checked",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // Given a baseline result count with no status filters applied
      await page.goto("/search?status=none");
      const initialSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      // check all 4 boxes
      const statusCheckboxes = {
        "status-forecasted": "forecasted",
        "status-open": "posted",
        "status-closed": "closed",
        "status-archived": "archived",
      };

      // When all opportunity status filters are selected
      await toggleFilterDrawer(page);
      await clickAccordionWithTitle(page, "Opportunity status");
      await toggleCheckboxes(page, statusCheckboxes, "status");

      // Then the total result count remains the same
      const updatedSearchResultsCount =
        await getNumberOfOpportunitySearchResults(page);

      expect(initialSearchResultsCount).toBe(updatedSearchResultsCount);
    },
  );

  test(
    "should redirect to the last page of results when page param is too high",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      // Given a page query parameter beyond the available range
      await page.goto("/search?page=1000000");

      await waitForAnyURLChange(page, "/search?page=1000000");

      // Then the app redirects to the highest valid results page
      expect(page.url()).toMatch(/search\?page=\d{1,3}/);
    },
  );
});
