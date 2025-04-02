// =========================
// Search Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";
import { camelCase } from "lodash";
import {
  waitForURLContainsQueryParam,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";

export function getSearchInput(page: Page) {
  return page.locator("#query");
}

export async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  await searchInput.fill(term);
  await page.click(".usa-search > button[type='submit']");
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
  await checkBox.isEnabled();
  await checkBox.click();
}

export async function refreshPageWithCurrentURL(page: Page) {
  const currentURL = page.url();
  await page.goto(currentURL); // go to new url in same tab
  return page;
}

export async function selectSortBy(page: Page, sortByValue: string) {
  await page.locator("#search-sort-by-select").selectOption(sortByValue);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function expectSortBy(page: Page, value: string) {
  const sortSelectElement = page.locator('select[name="search-sort-by"]');
  await expect(sortSelectElement).toHaveValue(value);
}

export async function waitForSearchResultsInitialLoad(page: Page) {
  // Wait for number of opportunities to show
  const resultsHeading = page.locator('h2:has-text("Opportunities")');
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
  const paginationButtons = page.locator("li > button");
  const count = await paginationButtons.count();

  // must be more than 1 page
  if (count > 2) {
    await paginationButtons.nth(count - 2).click();
  }
  // Delay for pagination debounce
  await page.waitForTimeout(400);
}

export async function getFirstSearchResultTitle(page: Page) {
  const firstResultSelector = page.locator(
    ".usa-list--unstyled > li:first-child h2 a",
  );
  return await firstResultSelector.textContent();
}

export async function getLastSearchResultTitle(page: Page) {
  const lastResultSelector = page.locator(
    ".usa-list--unstyled > li:last-child h2 a",
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
    .locator("h2.tablet-lg\\:grid-col-fill")
    .textContent();
  return opportunitiesText
    ? parseInt(opportunitiesText.replace(/\D/g, ""), 10)
    : 0;
}

export async function toggleMobileSearchFilters(page: Page) {
  const toggleButton = page.locator(
    "div[data-testid='content-display-toggle'] .usa-button--unstyled",
  );
  await toggleButton.click();
}
// returns the number of options available to be selected
export const selectAllTopLevelFilterOptions = async (
  page: Page,
  filterType: string,
): Promise<number> => {
  // gather number of (top level) filter options for filter type
  const numberOfFilterOptions = await page
    .locator(`#opportunity-filter-${filterType} > ul > li > div > input`)
    .count();

  // click select all for filter type
  const selectAllButton = page
    .locator(`#opportunity-filter-${filterType} button:has-text("Select All")`)
    .first();
  await selectAllButton.click();

  // validate that url is updated
  await waitForURLContainsQueryParam(page, filterType);

  return numberOfFilterOptions;
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
  // expect(page.locator(`input[name="${filterType}-*"]`)).toBeTruthy();
  const filterOptions = page.locator(`input[name="${filterType}-*"]`);
  await filterOptions.isVisible();
  await filterButton.click();
};
