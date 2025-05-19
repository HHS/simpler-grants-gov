import { expect, test } from "@playwright/test";
import { waitForAnyURLChange } from "tests/e2e/playwrightUtils";
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
  refreshPageWithCurrentURL,
  selectSortBy,
  toggleCheckboxes,
  toggleMobileSearchFilters,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";

const searchTerm = "education";
const statusCheckboxes = {
  "status-closed": "closed",
};
const fundingInstrumentCheckboxes = {
  "funding-instrument-cooperative_agreement": "cooperative_agreement",
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
  // Set all inputs, then refresh the page. Those same inputs should be
  // set from query params.
  test("should refresh and retain filters in a new tab", async ({ page }, {
    project,
  }) => {
    const agencyCheckboxes: { [key: string]: string } = {};
    await page.goto("/search");

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }
    await Promise.all([
      waitForSearchResultsInitialLoad(page),
      waitForFilterOptions(page, "agency"),
    ]);

    await selectSortBy(page, "agencyDesc");
    await expectSortBy(page, "agencyDesc");

    await fillSearchInputAndSubmit(searchTerm, page);

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
    const firstSubAgency = page
      .locator("#opportunity-filter-agency > ul > li ul input")
      .first();

    const agencyId = await firstSubAgency.getAttribute("id");
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

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    // Expect search inputs are retained in the new tab
    await expectSortBy(page, "agencyDesc");
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm);

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

  test("resets page back to 1 when choosing a filter", async ({ page }, {
    project,
  }) => {
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

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    await clickAccordionWithTitle(page, "Opportunity status");
    await toggleCheckboxes(page, statusCheckboxes, "status");

    // Wait for the page to reload
    await Promise.all([
      waitForSearchResultsInitialLoad(page),
      waitForFilterOptions(page, "agency"),
    ]);

    // Verify that page 1 is highlighted
    currentPageButton = page
      .locator(".usa-pagination__button.usa-current")
      .first();
    await expect(currentPageButton).toHaveAttribute("aria-label", "Page 1");

    // It should not have a page query param set
    await page.waitForURL("search?status=closed");
  });

  test("last result becomes first result when flipping sort order", async ({
    page,
  }, { project }) => {
    await page.goto("/search");

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    await Promise.all([
      waitForSearchResultsInitialLoad(page),
      waitForFilterOptions(page, "agency"),
    ]);

    await selectSortBy(page, "opportunityTitleDesc");

    await clickLastPaginationPage(page);

    const lastSearchResultTitle = await getLastSearchResultTitle(page);

    await selectSortBy(page, "opportunityTitleAsc");

    const firstSearchResultTitle = await getFirstSearchResultTitle(page);

    expect(firstSearchResultTitle).toBe(lastSearchResultTitle);
  });

  test("number of results is the same with none or all opportunity status checked", async ({
    page,
  }, { project }) => {
    await page.goto("/search?status=none");
    const initialSearchResultsCount =
      await getNumberOfOpportunitySearchResults(page);

    // check all 4 boxes
    const statusCheckboxes = {
      "status-forecasted": "forecasted",
      "status-posted": "posted",
      "status-closed": "closed",
      "status-archived": "archived",
    };

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    await clickAccordionWithTitle(page, "Opportunity status");
    await toggleCheckboxes(page, statusCheckboxes, "status");

    const updatedSearchResultsCount =
      await getNumberOfOpportunitySearchResults(page);

    expect(initialSearchResultsCount).toBe(updatedSearchResultsCount);
  });

  test("should redirect to the last page of results when page param is too high", async ({
    page,
  }) => {
    await page.goto("/search?page=1000000");

    await waitForAnyURLChange(page, "/search?page=1000000");

    expect(page.url()).toMatch(/search\?page=\d{1,3}/);
  });
});
