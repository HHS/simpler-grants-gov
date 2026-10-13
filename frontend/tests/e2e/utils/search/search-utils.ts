// =========================
// Search Test Helper Functions
// =========================

import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParamValue } from "tests/e2e/playwrightUtils";

const { targetEnv } = playwrightEnv;

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

  // Clear the input first to ensure it's empty
  await searchInput.clear();
  await page.waitForTimeout(100);

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

export async function selectSortBy(
  page: Page,
  sortByValue: string,
  drawer = false,
  projectName?: string,
) {
  const timeoutOption =
    targetEnv !== "local" ? { timeout: 60000 } : { timeout: 10000 };
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
  if (drawer && targetEnv !== "local") {
    await page.waitForTimeout(5000);
  }

  await expect(sortSelectElement).toHaveValue(sortByValue, timeoutOption);
}

export async function expectSortBy(page: Page, value: string, drawer = false) {
  const timeoutOption =
    targetEnv !== "local" ? { timeout: 60000 } : { timeout: 10000 };
  const sortSelectElement = drawer
    ? page.locator("#search-sort-by-select-drawer")
    : page.locator("#search-sort-by-select").first();
  await expect(sortSelectElement).toHaveValue(value, timeoutOption);
}

export async function waitForSearchResultsInitialLoad(
  page: Page,
  timeoutOverride?: number,
) {
  let timeout = targetEnv !== "local" ? 180000 : 60000;
  if (timeoutOverride) {
    timeout = timeoutOverride;
  }

  // Wait for the search route and core search UI controls to be available.
  await page.waitForURL(/\/search(\?|$)/, { timeout });
  await expect(getSearchInput(page)).toBeVisible({ timeout });

  // Wait for the result controls region, which indicates search data has rendered.
  await expect(
    page.locator("div[data-testid='search-results-controls'] h3").first(),
  ).toBeVisible({ timeout });
}

export async function verifyOpportunityInSearchByTitleAndNumber(
  page: Page,
  opportunityTitle: string,
  opportunityNumber: string,
  expectedStatus: string = "Open",
): Promise<void> {
  await page.goto("/search");
  await waitForSearchResultsInitialLoad(page);
  await fillSearchInputAndSubmit(opportunityTitle, page);

  const matchingSearchRow = page
    .locator("tr", {
      has: page.getByRole("link", { name: opportunityTitle }),
    })
    .first();

  await expect(matchingSearchRow).toBeVisible();
  await expect(matchingSearchRow).toContainText(opportunityTitle);
  await expect(matchingSearchRow).toContainText(opportunityNumber);
  await expect(matchingSearchRow).toContainText(expectedStatus);
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

/**
 * Clicks the specified pagination page when available; otherwise no-ops.
 */
export async function clickPaginationPageIfPresent(
  page: Page,
  pageNumber: number,
  callerLabel?: string,
): Promise<boolean> {
  const paginationButton = page.locator(
    `button[data-testid="pagination-page-number"][aria-label="Page ${pageNumber}"]`,
  );
  const isPresent = await paginationButton
    .first()
    .isVisible()
    .catch(() => false);

  if (isPresent) {
    await clickPaginationPageNumber(page, pageNumber);
    return true;
  }

  // eslint-disable-next-line no-console
  console.warn(
    `${callerLabel ?? "clickPaginationPageIfPresent"}: only one page of results ` +
      `for this criteria set; skipping navigation to page ${pageNumber}`,
  );
  return false;
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

export async function clickSearchNavLink(page: Page) {
  await page.click("nav >> text=Search");
}

export async function getNumberOfOpportunitySearchResults(page: Page) {
  await waitForLoaderToBeHidden(page);
  // The results table has its own Suspense boundary (keyed on searchParams, see SearchResults.tsx)
  // so we need to wait for it to finish loading before we can get the number of results
  await page
    .locator("text=Loading the table")
    .waitFor({ state: "hidden", timeout: 30000 });
  const opportunitiesText = await page
    .locator("div[data-testid='search-results-controls'] h3")
    .textContent();
  return opportunitiesText
    ? parseInt(opportunitiesText.replace(/\D/g, ""), 10)
    : 0;
}
