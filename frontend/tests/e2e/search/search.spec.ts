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

test.describe("Search page tests", () => {
  test("resets page back to 1 when choosing a filter", async ({ page }) => {
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

    await toggleFilterDrawer(page);

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
    const isMobile = !!project.name.match(/[Mm]obile/);
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);

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

    expect(firstSearchResultTitle).toBe(lastSearchResultTitle);
  });

  test("number of results is the same with none or all opportunity status checked", async ({
    page,
  }) => {
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

    await toggleFilterDrawer(page);
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
