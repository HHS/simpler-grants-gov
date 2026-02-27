// =========================
// Search Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";
import { camelCase } from "lodash";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  waitForURLContainsQueryParam,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";

const { targetEnv } = playwrightEnv;

const FILTER_OPTIONS_TIMEOUT = targetEnv === "staging" ? 30000 : 10000;

const getBrowserType = (page: Page, projectName?: string) => {
  if (projectName) {
    const normalized = projectName.toLowerCase();
    if (normalized.includes("webkit")) {
      return "webkit";
    }
    if (normalized.includes("firefox")) {
      return "firefox";
    }
    if (normalized.includes("chrome") || normalized.includes("chromium")) {
      return "chromium";
    }
  }

  return page.context().browser()?.browserType().name();
};

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

export function getSearchInput(page: Page) {
  return page.locator("#query");
}

export async function fillSearchInputAndSubmit(
  term: string,
  page: Page,
  projectName?: string,
) {
  const searchInput = getSearchInput(page);
  const submitButton = page.locator(".usa-search > button[type='submit']");

  // Firefox/Webkit need extra handling
  const browserType = getBrowserType(page, projectName);
  if (browserType === "firefox" || browserType === "webkit") {
    await searchInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }

  // this needs to be `pressSequentially` rather than `fill` because `fill` was not
  // reliably triggering onChange handlers in webkit
  await searchInput.pressSequentially(term);
  await expect(searchInput).toHaveValue(term, { timeout: 10000 });

  // Webkit needs extra handling
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

export function expectURLContainsQueryParam(
  page: Page,
  queryParamName: string,
) {
  const currentURL = page.url();
  expect(currentURL).toContain(queryParamName);
}

export async function expectCheckboxIDIsChecked(
  page: Page,
  idWithHash: string,
) {
  const checkbox: Locator = page.locator(idWithHash).first();
  await expect(checkbox).toBeChecked();
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
  const timeout = targetEnv === "staging" ? 120000 : 15000;
  await checkBox.waitFor({ state: "visible", timeout });
  await expect(checkBox).toBeEnabled();
  await checkBox.click();
}

export async function selectSortBy(
  page: Page,
  sortByValue: string,
  drawer = false,
  projectName?: string,
) {
  const timeoutOption =
    targetEnv === "staging" ? { timeout: 60000 } : { timeout: 10000 };
  const sortSelectElement = drawer
    ? page.locator("#search-sort-by-select-drawer")
    : page.locator("#search-sort-by-select").first();

  // Wait for the element to be visible and stable before interacting
  await sortSelectElement.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1000);

  // Webkit needs extra handling for form interactions
  const browserType = getBrowserType(page, projectName);
  if (browserType === "webkit") {
    await sortSelectElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }

  await sortSelectElement.click();
  await page.waitForTimeout(200);

  // Webkit needs special handling for selectOption - use keyboard navigation
  if (browserType === "webkit") {
    // Press down arrow to cycle through options
    for (let i = 0; i < 20; i++) {
      const currentValue = await sortSelectElement.inputValue();
      if (currentValue === sortByValue) {
        await page.waitForTimeout(300);
        await sortSelectElement.press("Enter");
        break;
      }
      await sortSelectElement.press("ArrowDown");
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1500);
  } else {
    await sortSelectElement.selectOption(sortByValue);
  }

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
  // Wait for page to stabilize before looking for results - helps with Firefox
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(500);
  
  const resultsHeading = page.locator('h3:has-text("Opportunities")').first();
  const timeout = targetEnv === "staging" ? 180000 : 60000;
  await resultsHeading.waitFor({ state: "visible", timeout });
  return await expect(resultsHeading).toBeVisible();
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

// If descending, select the ascending variant
export async function selectOppositeSortOption(page: Page) {
  const sortByDropdown = page.locator("#search-sort-by-select");
  const currentValue = await sortByDropdown.inputValue();
  let oppositeValue;

  if (currentValue.includes("Asc")) {
    oppositeValue = currentValue.replace("Asc", "Desc");
  } else if (currentValue.includes("Desc")) {
    oppositeValue = currentValue.replace("Desc", "Asc");
  } else {
    throw new Error(`Unexpected sort value: ${currentValue}`);
  }

  await sortByDropdown.selectOption(oppositeValue);
}

export async function waitForLoaderToBeHidden(page: Page) {
  await page.waitForSelector(
    ".display-flex.flex-align-center.flex-justify-center.margin-bottom-15.margin-top-15",
    { state: "hidden" },
  );
}

export async function ensureAccordionExpanded(
  page: Page,
  accordionTitle: string,
) {
  const button = page.locator(
    `button.usa-accordion__button:has-text("${accordionTitle}")`,
  );
  await button.waitFor({ state: "visible", timeout: 15000 });
  const expanded = await button.getAttribute("aria-expanded");
  if (expanded !== "true") {
    await button.click();
  }
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

export const getCountOfTopLevelFilterOptions = async (
  page: Page,
  filterType: string,
): Promise<number> => {
  const filterOptions = await page
    .locator(`#opportunity-filter-${filterType} > ul > li > div > input`)
    .all();

  const ids = await Promise.all(
    filterOptions.map((option) => option.getAttribute("id")),
  );
  return ids.filter((id) => !id?.match(/any$/)).length;
};

// returns the number of options available to be selected
export const selectAllTopLevelFilterOptions = async (
  page: Page,
  filterType: string,
): Promise<undefined> => {
  // gather number of (top level) filter options for filter type

  // click select all for filter type
  const selectAllButton = page
    .locator(`#opportunity-filter-${filterType} button:has-text("Select All")`)
    .first();
  await selectAllButton.click();

  // validate that url is updated
  await waitForURLContainsQueryParam(page, filterType);
};

export const validateTopLevelAndNestedSelectedFilterCounts = async (
  page: Page,
  filterName: string,
  expectedTopLevelCount: number,
  expectedNestedCount: number,
) => {
  // validate that the correct number of filter options is displayed
  const accordionButton = page.locator(
    `button[data-testid="accordionButton_opportunity-filter-${camelCase(filterName)}"]`,
  );

  await expect(accordionButton).toHaveText(
    `${filterName}${expectedTopLevelCount + expectedNestedCount}`,
  );

  const expanderButton = page.locator(
    `#opportunity-filter-${camelCase(filterName)} > ul > li:first-child > div > button`,
  );

  if (expectedNestedCount) {
    await expect(expanderButton).toContainText(`${expectedNestedCount}`);
  }
};

export const waitForFilterOptions = async (page: Page, filterType: string) => {
  const filterButton = page.locator(
    `button[aria-controls="opportunity-filter-${filterType}"]`,
  );
  await filterButton.waitFor({
    state: "visible",
    timeout: FILTER_OPTIONS_TIMEOUT,
  });
  await filterButton.click();

  const filterOptions = page.locator(`input[name="${filterType}-*"]`);
  // this is preferable but doesn't work
  // await filterOptions.waitFor({
  //   state: "visible",
  //   timeout: FILTER_OPTIONS_TIMEOUT,
  // });
  await filterOptions.isVisible();
  await filterButton.click();
};
