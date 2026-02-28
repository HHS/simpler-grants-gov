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

export async function ensureFilterDrawerOpen(page: Page) {
  const visibleStatusAccordion = page
    .locator('button[aria-controls="opportunity-filter-status"]:visible')
    .first();

  if (await visibleStatusAccordion.isVisible().catch(() => false)) {
    await page.waitForTimeout(200);
    return;
  }

  // Try the existing toggle helper first (handles open/close selector logic)
  await toggleFilterDrawer(page);
  await page.waitForTimeout(800);

  // If still not visible, force open from top of page using drawer open button
  if (!(await visibleStatusAccordion.isVisible().catch(() => false))) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const drawerOpenButton = page
      .locator("button[data-testid='toggle-drawer']")
      .first();
    if (await drawerOpenButton.isVisible().catch(() => false)) {
      await drawerOpenButton.click();
      await page.waitForTimeout(800);
    }
  }
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

  // Webkit needs extra wait before clicking submit
  if (browserType === "webkit") {
    await page.waitForTimeout(500);
  }

  await submitButton.click();

  if (browserType === "webkit") {
    await page.waitForTimeout(200);
    await searchInput.press("Enter");
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
  checkboxId: string,
) {
  const checkbox: Locator = page.locator(`input[id="${checkboxId}"]`).first();
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
  const checkBox = page.locator(`input[id="${idWithoutHash}"]`).first();
  const checkBoxLabel = page
    .locator(`label[for="${idWithoutHash}"]:visible`)
    .first();
  const timeout = targetEnv === "staging" ? 120000 : 30000;
  await checkBox.waitFor({ state: "attached", timeout });
  await checkBoxLabel.waitFor({ state: "visible", timeout });
  await checkBoxLabel.scrollIntoViewIfNeeded();
  await expect(checkBox).toBeEnabled();

  if (!(await checkBox.isChecked())) {
    await checkBoxLabel.click({ force: true });
  }
  await page.waitForTimeout(100);
}

export async function toggleCheckboxGroup(
  page: Page,
  checkboxObject: Record<string, string>,
) {
  for (const checkboxID of Object.keys(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
    await page.waitForTimeout(500);
  }
}

export async function expectCheckboxesChecked(
  page: Page,
  checkboxObject: Record<string, string>,
) {
  for (const checkboxID of Object.keys(checkboxObject)) {
    await expectCheckboxIDIsChecked(page, checkboxID);
  }
}

export async function getFirstNonNumericAgencyCheckboxId(page: Page) {
  const agencyCheckboxes = page.locator(
    '#opportunity-filter-agency input[type="checkbox"]',
  );

  const count = await agencyCheckboxes.count();
  for (let i = 0; i < count; i += 1) {
    const checkbox = agencyCheckboxes.nth(i);
    const id = await checkbox.getAttribute("id");
    const value = await checkbox.getAttribute("value");
    if (!id) {
      continue;
    }

    if (id.endsWith("-any") || value === "all") {
      continue;
    }

    if (!/^\d+$/.test(id) && !(await checkbox.isChecked())) {
      return id;
    }
  }

  return null;
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

  // Webkit needs extra handling for form interactions
  const browserType = getBrowserType(page, projectName);
  if (browserType === "webkit") {
    await sortSelectElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  }

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

export async function waitForSearchResultsInitialLoad(
  page: Page,
  timeoutOverride?: number,
) {
  // Wait for the page and results to load
  const resultsHeading = page.locator('h3:has-text("Opportunities")').first();
  let timeout = targetEnv === "staging" ? 180000 : 60000;
  if (timeoutOverride) {
    timeout = timeoutOverride;
  }
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
    `button.usa-accordion__button:has-text("${accordionTitle}"):visible`,
  );
  const timeout = targetEnv === "staging" ? 120000 : 30000;
  await button.waitFor({ state: "visible", timeout });
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const expanded = await button.getAttribute("aria-expanded");
  if (expanded !== "true") {
    await button.click();
    await page.waitForTimeout(300);
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
    `button[aria-controls="opportunity-filter-${filterType}"]:visible`,
  );
  const timeout = FILTER_OPTIONS_TIMEOUT;
  await filterButton.waitFor({ state: "visible", timeout });
  await filterButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await filterButton.click();
  await page.waitForTimeout(400);

  const filterOptions = page.locator(
    `#opportunity-filter-${filterType} label.usa-checkbox__label:visible`,
  );
  await filterOptions.first().waitFor({ state: "visible", timeout });
};
