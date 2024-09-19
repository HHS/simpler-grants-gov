import { expect, test } from "@playwright/test";

import {
  clickAccordionWithTitle,
  clickMobileNavMenu,
  clickSearchNavLink,
  expectCheckboxIDIsChecked,
  expectSortBy,
  expectURLContainsQueryParam,
  fillSearchInputAndSubmit,
  getMobileMenuButton,
  getSearchInput,
  hasMobileMenu,
  refreshPageWithCurrentURL,
  selectSortBy,
  toggleCheckboxes,
  waitForSearchResultsLoaded,
} from "./searchUtil";

test("should navigate from index to search page", async ({ page }) => {
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
  test.beforeEach(async ({ page }) => {
    // Navigate to the search page with the feature flag set
    await page.goto("/search?_ff=showSearchV0:true");
  });

  test("should return 0 results when searching for obscure term", async ({
    page,
    browserName,
  }) => {
    // TODO (Issue #2005): fix test for webkit
    test.skip(
      browserName === "webkit",
      "Skipping test for WebKit due to a query param issue.",
    );

    const searchTerm = "0resultearch";

    await fillSearchInputAndSubmit(searchTerm, page);

    expectURLContainsQueryParam(page, "query", searchTerm);

    const resultsHeading = page.getByRole("heading", {
      name: /0 Opportunities/i,
    });
    await expect(resultsHeading).toBeVisible();

    await expect(page.locator("div.usa-prose h2")).toHaveText(
      "Your search did not return any results.",
    );
  });

  test("should show and hide loading state", async ({ page, browserName }) => {
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
  test("should retain filters in a new tab", async ({ page }) => {
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

    await waitForSearchResultsLoaded(page);
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
});
