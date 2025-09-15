// =========================
// Search Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";
import { camelCase } from "lodash";
import {
  waitForURLContainsQueryParam,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";

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

export async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  const submitButton = page.locator(".usa-search > button[type='submit']");
  // this needs to be `pressSequentially` rather than `fill` because `fill` was not
  // reliably triggering onChange handlers in webkit
  await searchInput.pressSequentially(term);
  await expect(searchInput).toHaveValue(term);
  await submitButton.click();
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
  const checkbox: Locator = page.locator(idWithHash);
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
  await expect(checkBox).toBeEnabled();
  await checkBox.click();
}

export async function selectSortBy(
  page: Page,
  sortByValue: string,
  drawer = false,
) {
  await page
    .locator(`#search-sort-by-select${drawer ? "-drawer" : ""}`)
    .selectOption(sortByValue);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function expectSortBy(page: Page, value: string, drawer = false) {
  const sortSelectElement = page.locator(
    `#search-sort-by-select${drawer ? "-drawer" : ""}`,
  );
  await expect(sortSelectElement).toHaveValue(value);
}

export async function waitForSearchResultsInitialLoad(page: Page) {
  // Wait for number of opportunities to show
  const resultsHeading = page.locator('h3:has-text("Opportunities")');
  await resultsHeading.waitFor({ state: "visible", timeout: 60000 });
}

export async function clickAccordionWithTitle(
  page: Page,
  accordionTitle: string,
) {
  await page
    .locator(`button.usa-accordion__button:has-text("${accordionTitle}")`)
    .click();
}

export async function clickPaginationPageNumber(
  page: Page,
  pageNumber: number,
) {
  const paginationButton = page.locator(
    `button[data-testid="pagination-page-number"][aria-label="Page ${pageNumber}"]`,
  );
  await paginationButton.first().click();

  // Delay for pagination debounce
  await page.waitForTimeout(400);
}

export async function clickLastPaginationPage(page: Page) {
  const paginationButtons = page.locator("li.usa-pagination__page-no > button");
  const count = await paginationButtons.count();

  // must be more than 1 page
  if (count > 2) {
    const button = paginationButtons.nth(count - 1);
    await button.click();
  }
  // Delay for pagination debounce
  await page.waitForTimeout(400);
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
  await filterButton.click();
  const filterOptions = page.locator(`input[name="${filterType}-*"]`);
  await filterOptions.isVisible();
  await filterButton.click();
};
