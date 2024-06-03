import { Page, expect, test } from "@playwright/test";
import {
  clickAccordionWithTitle,
  clickLastPaginationPage,
  clickMobileNavMenu,
  clickPaginationPageNumber,
  clickSearchNavLink,
  expectCheckboxIDIsChecked,
  expectSortBy,
  expectURLContainsQueryParam,
  fillSearchInputAndSubmit,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  getMobileMenuButton,
  getNumberOfOpportunitySearchResults,
  getSearchInput,
  hasMobileMenu,
  refreshPageWithCurrentURL,
  selectOppositeSortOption,
  selectSortBy,
  toggleCheckboxes,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";

import { BrowserContextOptions } from "playwright-core";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test("should navigate from index to search page", async ({
  page,
}: PageProps) => {
  // Start from the index page with feature flag set
  await page.goto("/?_ff=showSearchV0:true");

  // Mobile chrome must first click the menu button
  if (await hasMobileMenu(page)) {
    const menuButton = getMobileMenuButton(page);
    await clickMobileNavMenu(menuButton);
  }

  await clickSearchNavLink(page);

  // Verify that the new URL is correct
  expectURLContainsQueryParam(page, "status", "forecasted,posted");

  // Verify the presence of "Search" content on the page
  await expect(page.locator("h1")).toContainText(
    "Search funding opportunities",
  );

  // Verify that the 'forecasted' and 'posted' are checked
  await expectCheckboxIDIsChecked(page, "#status-forecasted");
  await expectCheckboxIDIsChecked(page, "#status-posted");
});

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

  test("should show and hide loading state", async ({
    page,
    browserName,
  }: PageProps) => {
    // TODO (Issue #2005): fix test for webkit
    test.skip(
      browserName === "webkit",
      "Skipping test for WebKit due to a query param issue.",
    );
    const searchTerm = "advanced";
    await fillSearchInputAndSubmit(searchTerm, page);

    const loadingIndicator = page.locator("text='Loading results...'");
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    const searchTerm2 = "agency";
    await fillSearchInputAndSubmit(searchTerm2, page);
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();
  });

  test("should refresh and retain filters in a new tab", async ({
    page,
  }: PageProps) => {
    // Set all inputs, then refresh the page. Those same inputs should be
    // set from query params.
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
    currentPageButton = page.locator(".usa-pagination__button.usa-current");
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

    await selectOppositeSortOption(page);

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
