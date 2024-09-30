import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

import {
  clickAccordionWithTitle,
  clickLastPaginationPage,
  clickPaginationPageNumber,
  expectCheckboxIDIsChecked,
  expectSortBy,
  expectURLContainsQueryParam,
  fillSearchInputAndSubmit,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  getNumberOfOpportunitySearchResults,
  getSearchInput,
  refreshPageWithCurrentURL,
  selectSortBy,
  toggleCheckboxes,
  waitForSearchResultsInitialLoad,
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

  test("should refresh and retain filters in a new tab", async ({
    page,
  }: PageProps) => {
    // Set all inputs, then refresh the page. Those same inputs should be
    // set from query params.
    // console.log("!!!!", contextOptions);
    const searchTerm = "education";
    const statusCheckboxes = {
      "status-forecasted": "forecasted",
      "status-posted": "posted",
    };
    const fundingInstrumentCheckboxes = {
      "funding-instrument-cooperative_agreement": "cooperative_agreement",
      "funding-instrument-grant": "grant",
    };

    const eligibilityCheckboxes = {
      "eligibility-state_governments": "state_governments",
      "eligibility-county_governments": "county_governments",
    };
    const agencyCheckboxes = {
      ARPAH: "ARPAH",
      AC: "AC",
    };
    const categoryCheckboxes = {
      "category-recovery_act": "recovery_act",
      "category-agriculture": "agriculture",
    };

    await selectSortBy(page, "agencyDesc");

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page);

    await toggleCheckboxes(page, statusCheckboxes, "status");

    await clickAccordionWithTitle(page, "Funding instrument");
    await toggleCheckboxes(
      page,
      fundingInstrumentCheckboxes,
      "fundingInstrument",
    );

    await clickAccordionWithTitle(page, "Eligibility");
    await toggleCheckboxes(page, eligibilityCheckboxes, "eligibility");

    await clickAccordionWithTitle(page, "Agency");
    await toggleCheckboxes(page, agencyCheckboxes, "agency");

    await clickAccordionWithTitle(page, "Category");
    await toggleCheckboxes(page, categoryCheckboxes, "category");

    /***********************************************************/
    /* Page refreshed should have all the same inputs selected
    /***********************************************************/

    await refreshPageWithCurrentURL(page);

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

  test("resets page back to 1 when choosing a filter", async ({
    page,
  }: PageProps) => {
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
    await toggleCheckboxes(page, statusCheckboxes, "status");

    // Wait for the page to reload
    await waitForSearchResultsInitialLoad(page);

    // Verify that page 1 is highlighted
    currentPageButton = page
      .locator(".usa-pagination__button.usa-current")
      .first();
    await expect(currentPageButton).toHaveAttribute("aria-label", "Page 1");

    // It should not have a page query param set
    expectURLContainsQueryParam(page, "page", "1", false);
  });

  test("last result becomes first result when flipping sort order", async ({
    page,
  }: PageProps) => {
    await selectSortBy(page, "opportunityTitleDesc");

    await clickLastPaginationPage(page);

    await waitForSearchResultsInitialLoad(page);

    const lastSearchResultTitle = await getLastSearchResultTitle(page);

    await selectSortBy(page, "opportunityTitleAsc");

    const firstSearchResultTitle = await getFirstSearchResultTitle(page);

    expect(firstSearchResultTitle).toBe(lastSearchResultTitle);
  });

  test("number of results is the same with none or all opportunity status checked", async ({
    page,
  }: PageProps) => {
    const initialNumberOfOpportunityResults =
      await getNumberOfOpportunitySearchResults(page);

    // check all 4 boxes
    const statusCheckboxes = {
      "status-forecasted": "forecasted",
      "status-posted": "posted",
      "status-closed": "closed",
      "status-archived": "archived",
    };

    await toggleCheckboxes(page, statusCheckboxes, "status");

    const updatedNumberOfOpportunityResults =
      await getNumberOfOpportunitySearchResults(page);

    expect(initialNumberOfOpportunityResults).toBe(
      updatedNumberOfOpportunityResults,
    );
  });
});
