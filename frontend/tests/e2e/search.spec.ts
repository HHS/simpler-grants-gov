import { Locator, Page, expect, test } from "@playwright/test";

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
  }) => {
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

  test("should show and hide loading state", async ({ page }) => {
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

// =========================
// Test Helper Functions
// =========================

function getSearchInput(page: Page) {
  return page.locator("#query");
}

async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  await searchInput.fill(term);
  await page.click(".usa-search >> button[type='submit']");
  expectURLContainsQueryParam(page, "query", term);
}

function expectURLContainsQueryParam(
  page: Page,
  queryParamName: string,
  queryParamValue: string,
) {
  const currentURL = page.url();
  expect(currentURL).toContain(`${queryParamName}=${queryParamValue}`);
}

async function waitForURLContainsQueryParam(
  page: Page,
  queryParamName: string,
  queryParamValue: string,
  timeout = 30000, // query params get set after a debounce period
) {
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const url = new URL(page.url());
    const params = new URLSearchParams(url.search);
    const actualValue = params.get(queryParamName);

    if (actualValue === queryParamValue) {
      return;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(
    `URL did not contain query parameter ${queryParamName}=${queryParamValue} within ${timeout}ms`,
  );
}

async function clickSearchNavLink(page: Page) {
  await page.click("nav >> text=Search");
}

function getMobileMenuButton(page: Page) {
  return page.locator("button >> text=MENU");
}

async function hasMobileMenu(page: Page) {
  const menuButton = getMobileMenuButton(page);
  return await menuButton.isVisible();
}

async function clickMobileNavMenu(menuButton: Locator) {
  await menuButton.click();
}

async function expectCheckboxIDIsChecked(page: Page, idWithHash: string) {
  const checkbox: Locator = page.locator(idWithHash);
  await expect(checkbox).toBeChecked();
}

async function toggleCheckboxes(
  page: Page,
  checkboxObject: Record<string, string>,
  queryParamName: string,
) {
  let runningQueryParams = "";
  for (const [checkboxID, queryParamValue] of Object.entries(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
    runningQueryParams += runningQueryParams
      ? `,${queryParamValue}`
      : queryParamValue;
    await waitForURLContainsQueryParam(
      page,
      queryParamName,
      runningQueryParams,
    );
  }
}

async function toggleCheckbox(page: Page, idWithoutHash: string) {
  const checkBox = page.locator(`label[for=${idWithoutHash}]`);
  await checkBox.isEnabled();
  await checkBox.click();
}

async function refreshPageWithCurrentURL(page: Page) {
  const currentURL = page.url();
  await page.goto(currentURL); // go to new url in same tab
  return page;
}

async function selectSortBy(page: Page, sortByValue: string) {
  await page.locator("#search-sort-by-select").selectOption(sortByValue);
}

async function expectSortBy(page: Page, value: string) {
  const selectedValue = await page
    .locator('select[name="search-sort-by"]')
    .inputValue();
  expect(selectedValue).toBe(value);
}

async function waitForSearchResultsLoaded(page: Page) {
  // Wait for number of opportunities to show
  const resultsHeading = page.locator('h2:has-text("Opportunities")');
  await resultsHeading.waitFor({ state: "visible", timeout: 60000 });
}

async function clickAccordionWithTitle(page: Page, accordionTitle: string) {
  await page
    .locator(`button.usa-accordion__button:has-text("${accordionTitle}")`)
    .click();
}
