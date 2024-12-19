import { expect, test } from "@playwright/test";
import { camelCase } from "lodash";
import { PageProps } from "tests/e2e/playwrightUtils";
import {
  clickAccordionWithTitle,
  clickLastPaginationPage,
  clickPaginationPageNumber,
  expectCheckboxIDIsChecked,
  expectSortBy,
  expectURLContainsQueryParamValue,
  fillSearchInputAndSubmit,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  getNumberOfOpportunitySearchResults,
  getSearchInput,
  refreshPageWithCurrentURL,
  selectSortBy,
  toggleCheckboxes,
  toggleMobileSearchFilters,
  waitForSearchResultsInitialLoad,
  waitForUrl,
  waitForURLContainsQueryParam,
} from "tests/e2e/search/searchSpecUtil";

test.describe("Search page tests", () => {
  test("should refresh and retain filters in a new tab", async ({ page }, {
    project,
  }) => {
    await page.goto("/search");

    // Set all inputs, then refresh the page. Those same inputs should be
    // set from query params.
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
    const agencyCheckboxes = {
      EPA: "EPA",
      AC: "AC",
    };
    const categoryCheckboxes = {
      "category-recovery_act": "recovery_act",
      "category-agriculture": "agriculture",
    };

    await selectSortBy(page, "agencyDesc");

    await waitForSearchResultsInitialLoad(page);

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

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

    await toggleCheckboxes(page, statusCheckboxes, "status");

    // Wait for the page to reload
    await waitForSearchResultsInitialLoad(page);

    // Verify that page 1 is highlighted
    currentPageButton = page
      .locator(".usa-pagination__button.usa-current")
      .first();
    await expect(currentPageButton).toHaveAttribute("aria-label", "Page 1");

    // It should not have a page query param set
    expectURLContainsQueryParamValue(page, "page", "1", false);
  });

  test("last result becomes first result when flipping sort order", async ({
    page,
  }: PageProps) => {
    await page.goto("/search");
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
  }, { project }) => {
    await page.goto("/search?status=none");
    const initialNumberOfOpportunityResults =
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

    await toggleCheckboxes(page, statusCheckboxes, "status");

    const updatedNumberOfOpportunityResults =
      await getNumberOfOpportunitySearchResults(page);

    expect(initialNumberOfOpportunityResults).toBe(
      updatedNumberOfOpportunityResults,
    );
  });
  test.describe("selecting and clearing filters", () => {
    const filterTypes = [
      "Funding instrument",
      "Eligibility",
      "Category",
      "Agency",
    ];

    filterTypes.forEach((filterType) => {
      test.only(`correctly clears and selects all for ${filterType} filters`, async ({
        page,
      }, { project }) => {
        const camelCaseFilterType = camelCase(filterType);
        // load search page
        await page.goto("/search");

        const initialNumberOfOpportunityResults =
          await getNumberOfOpportunitySearchResults(page);

        // open accordion for filter type
        if (project.name.match(/[Mm]obile/)) {
          await toggleMobileSearchFilters(page);
        }

        await clickAccordionWithTitle(page, filterType);

        // gather number of (top level) filter options for filter type
        const numberOfFilterOptions = await page
          .locator(
            `#opportunity-filter-${camelCaseFilterType} > ul > li > div > input`,
          )
          .count();

        // click select all for filter type
        const selectAllButton = page.locator(
          `#opportunity-filter-${camelCaseFilterType} button:has-text("Select All")`,
        );
        await selectAllButton.click();

        // validate that url is updated
        await waitForURLContainsQueryParam(page, camelCaseFilterType);

        // validate that new search results are returned
        let updatedNumberOfOpportunityResults =
          await getNumberOfOpportunitySearchResults(page);
        expect(initialNumberOfOpportunityResults).not.toBe(
          updatedNumberOfOpportunityResults,
        );

        // validate that checkboxes are checked
        let checkboxes = await page
          .locator(
            `#opportunity-filter-${camelCaseFilterType} > ul > li > div > input`,
          )
          .all();

        await Promise.all(
          checkboxes.map((checkbox) => expect(checkbox).toBeChecked()),
        );

        // validate that the correct number of filter options is displayed
        const accordionButton = page.locator(
          `button[data-testid="accordionButton_opportunity-filter-${camelCaseFilterType}"]`,
        );

        await expect(accordionButton).toHaveText(
          `${filterType}${numberOfFilterOptions}`,
        );

        // click clear all
        await page
          .locator(
            `#opportunity-filter-${camelCaseFilterType} button:has-text("Clear All")`,
          )
          .click();

        // validate that url is updated
        await waitForUrl(page, "http://127.0.0.1:3000/search");

        // validate that new search results are returned
        updatedNumberOfOpportunityResults =
          await getNumberOfOpportunitySearchResults(page);
        expect(initialNumberOfOpportunityResults).toBe(
          updatedNumberOfOpportunityResults,
        );

        // validate that checkboxes are not checked
        checkboxes = await page
          .locator(
            `#opportunity-filter-${camelCaseFilterType} > ul > li > div > input`,
          )
          .all();

        await Promise.all(
          checkboxes.map((checkbox) => expect(checkbox).not.toBeChecked()),
        );

        // validate that the correct number of filter options is displayed
        await expect(accordionButton).toHaveText(filterType);
      });
    });
  });
});
