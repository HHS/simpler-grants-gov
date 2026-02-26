// =========================
// Search Test Helper Functions - Issue #8661
// Only includes functions needed for: "should retain search input and sort after refresh"
// Plus additional functions needed by existing search.spec.ts tests
// =========================

import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParamValue } from "tests/e2e/playwrightUtils";

const { targetEnv } = playwrightEnv;

export function getSearchInput(page: Page) {
  return page.locator("#query");
}

export async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  const submitButton = page.locator(".usa-search > button[type='submit']");
  
  // Firefox/Webkit need extra handling
  const browserType = page.context().browser()?.browserType().name();
  if (browserType === "firefox" || browserType === "webkit") {
    await searchInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }
  
  // this needs to be `pressSequentially` rather than `fill` because `fill` was not
  // reliably triggering onChange handlers in webkit
  await searchInput.pressSequentially(term);
  await expect(searchInput).toHaveValue(term, { timeout: 10000 });
  
  // Webkit needs extra wait before clicking submit
  if (browserType === "webkit") {
    await page.waitForTimeout(500);
    // For Webkit, wait for URL to change after clicking
    await Promise.all([
      page.waitForURL(/.*query=.*/, { timeout: 30000 }).catch(() => undefined),
      submitButton.click(),
    ]);
    await page.waitForTimeout(1000);
  } else {
    await submitButton.click();
  }
}

export async function selectSortBy(
  page: Page,
  sortByValue: string,
  drawer = false,
) {
  const timeoutOption =
    targetEnv === "staging" ? { timeout: 60000 } : { timeout: 10000 };
  const sortSelectElement = drawer
    ? page.locator("#search-sort-by-select-drawer")
    : page.locator("#search-sort-by-select").first();
  await sortSelectElement.selectOption(sortByValue);
  // For mobile drawer on staging, wait longer as it can be very slow
  if (drawer && targetEnv === "staging") {
    await page.waitForTimeout(5000);
  }
  await expect(sortSelectElement).toHaveValue(sortByValue, timeoutOption);
}

export async function expectSortBy(page: Page, value: string, drawer = false) {
  const timeoutOption =
    targetEnv === "staging" ? { timeout: 60000 } : { timeout: 10000 };
  const sortSelectElement = drawer
    ? page.locator("#search-sort-by-select-drawer")
    : page.locator("#search-sort-by-select").first();
  await expect(sortSelectElement).toHaveValue(value, timeoutOption);
}

export async function waitForSearchResultsInitialLoad(page: Page) {
  const resultsHeading = page.locator('h3:has-text("Opportunities")').first();
  const timeout = targetEnv === "staging" ? 180000 : 60000;
  await resultsHeading.waitFor({ state: "visible", timeout });
  return await expect(resultsHeading).toBeVisible();
}

// Additional functions needed by search.spec.ts
export async function toggleFilterDrawer(page: Page) {
  const modalOpen = await page
    .locator('.usa-modal-overlay[aria-controls="search-filter-drawer"]')
    .isVisible();
  const drawerToggleButtonSelector = modalOpen
    ? "button[data-testid='close-drawer']"
    : "button[data-testid='toggle-drawer']";
  const filterDrawerButton = page.locator(drawerToggleButtonSelector);
  await filterDrawerButton.click();
}

export async function clickAccordionWithTitle(
  page: Page,
  accordionTitle: string,
) {
  const button = page.locator(
    `button.usa-accordion__button:has-text("${accordionTitle}")`,
  );
  await button.waitFor({ state: "visible", timeout: 15000 });
  await button.click();
}

export async function toggleCheckboxes(
  page: Page,
  checkboxObject: Record<string, string>,
  queryParamName: string,
  startingQueryParams?: string,
) {
  let runningQueryParams = startingQueryParams ?? "";
  for (const [checkboxID, queryParamValue] of Object.entries(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
    runningQueryParams += runningQueryParams
      ? `,${queryParamValue}`
      : queryParamValue;
    await waitForURLContainsQueryParamValue(
      page,
      queryParamName,
      runningQueryParams,
    );
  }
}

export async function toggleCheckbox(page: Page, idWithoutHash: string) {
  const checkBox = page.locator(`label[for=${idWithoutHash}]`);
  const timeout = targetEnv === "staging" ? 120000 : 20000;
  
  // Webkit needs extra handling for visibility
  const browserType = page.context().browser()?.browserType().name();
  if (browserType === "webkit") {
    await checkBox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  
  await checkBox.waitFor({ state: "visible", timeout });
  await expect(checkBox).toBeEnabled();
  await checkBox.click();
  
  // Webkit needs extra wait after click
  if (browserType === "webkit") {
    await page.waitForTimeout(300);
  }
}

export async function waitForFilterOptions(page: Page, filterType: string) {
  const FILTER_OPTIONS_TIMEOUT = targetEnv === "staging" ? 30000 : 20000;
  const filterButton = page.locator(
    `button[aria-controls="opportunity-filter-${filterType}"]`,
  );
  
  // Firefox and Webkit need extra scroll/wait handling for visibility
  const browserType = page.context().browser()?.browserType().name();
  if (browserType === "firefox" || browserType === "webkit") {
    await filterButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  
  // For concurrent test execution, we need to be more patient
  try {
    await filterButton.waitFor({
      state: "visible",
      timeout: FILTER_OPTIONS_TIMEOUT,
    });
  } catch (e) {
    // If visibility check fails, try scrolling again and waiting
    await filterButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await filterButton.waitFor({
      state: "attached",
      timeout: FILTER_OPTIONS_TIMEOUT,
    });
  }
  
  await filterButton.click();

  const filterOptions = page.locator(`input[name="${filterType}-*"]`);
  await filterOptions.isVisible();
  await filterButton.click();
}

export async function clickPaginationPageNumber(
  page: Page,
  pageNumber: number,
) {
  const paginationButton = page.locator(
    `button[data-testid="pagination-page-number"][aria-label="Page ${pageNumber}"]`,
  );
  await paginationButton.first().click();
  await waitForURLContainsQueryParamValue(page, "page", pageNumber.toString());
}

export async function clickLastPaginationPage(page: Page) {
  const paginationButtons = page.locator("li.usa-pagination__page-no > button");
  const count = await paginationButtons.count();

  // must be more than 1 page
  if (count > 2) {
    const button = paginationButtons.nth(count - 1);
    const pageNumber = await button.textContent();
    if (!pageNumber) {
      throw new Error("unable to click pagination button, button has no label");
    }
    await button.click();
    await waitForURLContainsQueryParamValue(page, "page", pageNumber);
  } else {
    console.error("not clicking on last page, only one page exists!");
  }
}

export async function getFirstSearchResultTitle(page: Page) {
  const firstResultSelector = page.locator(
    ".simpler-responsive-table tr:first-child a",
  );
  return await firstResultSelector.textContent();
}

export async function getLastSearchResultTitle(page: Page) {
  const lastResultSelector = page.locator(
    ".simpler-responsive-table tr:last-child a",
  );
  return await lastResultSelector.textContent();
}

export async function getNumberOfOpportunitySearchResults(page: Page) {
  await waitForLoaderToBeHidden(page);
  const opportunitiesText = await page
    .locator("div[data-testid='search-results-controls'] h3")
    .textContent();
  return opportunitiesText
    ? parseInt(opportunitiesText.replace(/\D/g, ""), 10)
    : 0;
}

export async function waitForLoaderToBeHidden(page: Page) {
  await page.waitForSelector(
    ".display-flex.flex-align-center.flex-justify-center.margin-bottom-15.margin-top-15",
    { state: "hidden" },
  );
}
