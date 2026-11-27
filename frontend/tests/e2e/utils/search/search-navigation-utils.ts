// =========================
// Opportunity Detail Navigation Test Helper Functions
// =========================

import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParamValue } from "tests/e2e/playwrightUtils";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectCheckboxIDIsChecked,
  getFilterDrawer,
  toggleFilterDrawer,
} from "tests/e2e/utils/search/search-filter-utils";
import {
  applyStatusNarrowingFilter,
  expectSortSelected,
  readResultRows,
  SEARCH_PAGE_SIZE,
  selectSortCase,
  SORT_CASES,
  type SortCase,
} from "tests/e2e/utils/search/search-sort-utils";
import {
  clickPaginationPageNumber,
  fillSearchInputAndSubmit,
  getNumberOfOpportunitySearchResults,
  getPaginationPageButton,
  getSearchInput,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/search-utils";

const { baseUrl, targetEnv } = playwrightEnv;

const NAVIGATION_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

// Result titles link to /opportunity/<opportunity_id>
const DETAIL_URL_PATTERN = /\/opportunity\/[^/?#]+/;
const DETAIL_ID_PATTERN = /\/opportunity\/([^/?#]+)/;

const clean = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Result states a user can open an Opportunity Detail page from
// ---------------------------------------------------------------------------

export const RESULT_STATE_TYPES = ["filters", "sorting", "pagination"] as const;
export type ResultStateType = (typeof RESULT_STATE_TYPES)[number];

// Any option other than the default "Most relevant", which has no sortby in the URL.
const NAVIGATION_SORT_VALUE = "closeDateAsc";

export function getNavigationSortCase(): SortCase {
  const sortCase = SORT_CASES.find(
    ({ value }) => value === NAVIGATION_SORT_VALUE,
  );
  if (!sortCase) {
    throw new Error(`No sort case with value "${NAVIGATION_SORT_VALUE}"`);
  }
  return sortCase;
}

/**
 * Goes to page 2 of the current results. Expects the results to have more than one page, and
 * says how many there were if not.
 */
async function goToPage2(page: Page): Promise<void> {
  const total = await getNumberOfOpportunitySearchResults(page);
  expect(
    total,
    `Expected more than one page of results (over ${SEARCH_PAGE_SIZE}) but found ${total} ` +
      `at ${page.url()}. If this starts failing, the data no longer has enough opportunities`,
  ).toBeGreaterThan(SEARCH_PAGE_SIZE);

  // Wait for the button rather than using clickPaginationPageIfPresent, which checks once
  await expect(
    getPaginationPageButton(page, 2).first(),
    `Expected a page 2 button for ${total} results at ${page.url()}`,
  ).toBeVisible({ timeout: 15000 });
  await clickPaginationPageNumber(page, 2);
}

/**
 * Applies one kind of result state through the UI, leaving the browser on search results:
 * - filters: unchecks the Forecasted status
 * - sorting: selects a non-default sort option
 * - pagination: goes to page 2 (the default catalog spans several pages)
 */
export async function applyResultState(
  page: Page,
  stateType: ResultStateType,
  isMobile: boolean,
  projectName: string,
): Promise<void> {
  switch (stateType) {
    case "filters":
      await applyStatusNarrowingFilter(page);
      break;
    case "sorting":
      await selectSortCase(
        page,
        getNavigationSortCase(),
        isMobile,
        projectName,
      );
      break;
    case "pagination":
      await goToPage2(page);
      break;
  }
  await getNumberOfOpportunitySearchResults(page);
}

// ---------------------------------------------------------------------------
// Selecting and opening a result
// ---------------------------------------------------------------------------

export type SelectedResult = {
  title: string;
  // The link's href, as copied with "Copy link address"
  href: string;
  opportunityId: string;
  // Empty when the opportunity has no number
  opportunityNumber: string;
};

// :visible, because the keyed Suspense in SearchResults.tsx can leave a hidden duplicate of the
// table in the DOM while results re-render.
const getResultTitleLinks = (page: Page) =>
  page.locator(
    '.simpler-responsive-table:visible a[id^="search-result-link-"]',
  );

/**
 * Reads the title, link and opportunity number of a result row without clicking it.
 * The number is read with textContent because it is display:none below the tablet-lg breakpoint.
 */
export async function readResultSelection(
  page: Page,
  index = 0,
): Promise<SelectedResult> {
  const link = getResultTitleLinks(page).nth(index);
  await expect(link).toBeVisible();

  const href = (await link.getAttribute("href")) ?? "";
  const opportunityId = DETAIL_ID_PATTERN.exec(href)?.[1];
  if (!opportunityId) {
    throw new Error(
      `Result #${index} link "${href}" does not point to an Opportunity Detail page`,
    );
  }

  // The row renders "<label>: <number>" under the title link
  const numberText = await link.evaluate(
    (anchor) =>
      anchor.closest(".grid-col-fill")?.querySelector(".font-sans-xs")
        ?.textContent ?? "",
  );

  return {
    title: clean(await link.textContent()),
    href,
    opportunityId,
    opportunityNumber: clean(numberText.slice(numberText.indexOf(":") + 1)),
  };
}

/**
 * Clicks a result's title and waits for the Opportunity Detail URL.
 * Returns what the row showed, so the detail page can be checked against it.
 */
export async function clickResultTitle(
  page: Page,
  index = 0,
): Promise<SelectedResult> {
  const selected = await readResultSelection(page, index);
  await getResultTitleLinks(page).nth(index).click();
  await page.waitForURL(DETAIL_URL_PATTERN, { timeout: NAVIGATION_TIMEOUT });
  return selected;
}

const getHistoryLength = (page: Page) =>
  page.evaluate(() => window.history.length);

/**
 * Fires several clicks on a result's title in quick succession (dispatched together, so none
 * waits for the previous navigation). Returns the result that was clicked and how many browser
 * history entries the clicks added.
 */
export async function rapidlyClickResultTitle(
  page: Page,
  index = 0,
  clicks = 5,
): Promise<{ selected: SelectedResult; historyEntriesAdded: number }> {
  const selected = await readResultSelection(page, index);
  const link = getResultTitleLinks(page).nth(index);
  const historyBefore = await getHistoryLength(page);

  // Dispatch rapid clicks - browsers may cancel some navigations due to rapid input or policy checks,
  // which is expected behavior. Use Promise.allSettled to handle individual click failures.
  await Promise.allSettled(
    Array.from({ length: clicks }, () =>
      link.dispatchEvent("click", undefined, { timeout: 3000 }),
    ),
  );

  // Wait for the page URL to match the detail page pattern. Use waitForFunction (polling the URL)
  // rather than waitForNavigation (listening to events), as navigation events can be cancelled
  // by the browser during rapid clicks, but the page will still navigate successfully eventually.
  await page.waitForFunction(
    (pattern: string) => {
      const urlPattern = new RegExp(pattern);
      return urlPattern.test(window.location.href);
    },
    DETAIL_URL_PATTERN.toString(),
    { timeout: NAVIGATION_TIMEOUT },
  );

  await expectOpportunityDetailPage(page, selected);

  return {
    selected,
    historyEntriesAdded: (await getHistoryLength(page)) - historyBefore,
  };
}

// ---------------------------------------------------------------------------
// Opportunity Detail page
// ---------------------------------------------------------------------------

/**
 * Asserts the browser is on the detail page of the selected result: the URL has its identifier,
 * and the page shows its title (h1) and its opportunity number.
 */
export async function expectOpportunityDetailPage(
  page: Page,
  selected: SelectedResult,
): Promise<void> {
  await expect(page).toHaveURL(
    new RegExp(`/opportunity/${selected.opportunityId}(?:[/?#]|$)`),
    { timeout: NAVIGATION_TIMEOUT },
  );
  await expect(
    page.getByTestId("opportunity-header").getByRole("heading", { level: 1 }),
  ).toHaveText(selected.title, { timeout: NAVIGATION_TIMEOUT });

  if (selected.opportunityNumber) {
    await expect(
      page.locator("li", { hasText: "Funding opportunity number" }).first(),
    ).toContainText(selected.opportunityNumber);
  }
}

/**
 * Asserts an Opportunity Detail page rendered its content rather than an error page, and that
 * nothing is still loading.
 */
export async function expectOpportunityDetailLoaded(page: Page): Promise<void> {
  await expect(page).toHaveTitle(/^Opportunity Listing - /);
  await expect(page.getByTestId("opportunity-intro-content")).toBeVisible();
  // The app's Spinner renders role="progressbar"
  await expect(page.getByRole("progressbar")).toHaveCount(0);
}

/**
 * Asserts the status tag in the Opportunity Detail header shows a status. Its visible label is
 * aria-hidden, with a screen reader label beside it, so the check targets the visible label.
 */
export async function expectOpportunityStatusTag(page: Page): Promise<void> {
  await expect(
    page
      .getByTestId("opportunity-header-status")
      .locator('[aria-hidden="true"]'),
  ).toHaveText(/^(Open|Forecasted|Closed|Archived)$/);
}

/**
 * Navigates straight to a detail URL (a link copied from the results table) and checks the
 * server answered without an error.
 */
export async function gotoOpportunityDetailByLink(
  page: Page,
  href: string,
): Promise<void> {
  const response = await page.goto(new URL(href, baseUrl).toString(), {
    timeout: NAVIGATION_TIMEOUT,
  });
  expect(
    response?.status(),
    `Direct navigation to ${href} should not return an error`,
  ).toBeLessThan(400);
}

/**
 * Presses the browser back button from a detail page and waits for search results.
 */
export async function goBackToSearchResults(page: Page): Promise<void> {
  await page.goBack({
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT,
  });
  await waitForSearchResultsInitialLoad(page);
  await getNumberOfOpportunitySearchResults(page);
}

// ---------------------------------------------------------------------------
// Search state preserved after returning from a detail page
// ---------------------------------------------------------------------------

// Tried in order, through the search box itself. The state test needs a keyword that still has
// more than one page of results once the status filter is applied, and seed data differs between
// environments.
const KEYWORD_CANDIDATES = ["education", "research", "health", "community"];

export type SearchState = {
  query: string | null;
  status: string | null;
  sortby: string | null;
  page: string | null;
  // Opportunities shown, in order. Equal ids mean the same page of the same results.
  resultIds: string[];
};

/**
 * Applies the status filter, a keyword, a sort option and then page 2, through the UI, and
 * returns the keyword used. Page 2 comes last because changing the keyword, filter or sort goes
 * back to page 1.
 *
 * The keyword is chosen in this same flow, by trying candidates until one has more than one page
 * of results for the filtered search, so the count matches what the user flow ends up with.
 */
export async function applyKeywordFilterSortAndPage2(
  page: Page,
  sortCase: SortCase,
  isMobile: boolean,
  projectName: string,
): Promise<string> {
  // The filter first, so the keyword counts below are for the filtered results
  await applyStatusNarrowingFilter(page);

  const attempted: string[] = [];
  let term: string | undefined;
  for (const candidate of KEYWORD_CANDIDATES) {
    await fillSearchInputAndSubmit(candidate, page, projectName);
    await waitForURLContainsQueryParamValue(page, "query", candidate);
    await waitForSearchResultsInitialLoad(page);
    const count = await getNumberOfOpportunitySearchResults(page);
    attempted.push(`"${candidate}" -> ${count}`);
    if (count > SEARCH_PAGE_SIZE) {
      term = candidate;
      break;
    }
  }
  if (!term) {
    throw new Error(
      `No keyword returned more than ${SEARCH_PAGE_SIZE} posted results. ` +
        `Tried: ${attempted.join("; ")}`,
    );
  }

  await selectSortCase(page, sortCase, isMobile, projectName);
  await goToPage2(page);
  await getNumberOfOpportunitySearchResults(page);
  return term;
}

export async function captureSearchState(page: Page): Promise<SearchState> {
  const params = new URL(page.url()).searchParams;
  return {
    query: params.get("query"),
    status: params.get("status"),
    sortby: params.get("sortby"),
    page: params.get("page"),
    resultIds: (await readResultRows(page)).map((row) => row.id),
  };
}

/**
 * Asserts the search the user left is what they come back to: URL params, the keyword in the
 * search box, the checked status filters, the selected sort option, and the same results on the
 * same page.
 */
export async function expectSearchStatePreserved(
  page: Page,
  before: SearchState,
  sortCase: SortCase,
  isMobile: boolean,
): Promise<void> {
  // The keyword
  await expect(getSearchInput(page)).toHaveValue(before.query ?? "");

  // Filters: only "Open" (posted) remains selected
  await ensureFilterDrawerOpen(page);
  await ensureAccordionExpanded(page, "Opportunity status");
  // The "Open" status checkbox has the id status-open and the value "posted"
  await expectCheckboxIDIsChecked(page, "status-open");
  await expect(
    page.locator('input[id="status-forecasted"]').first(),
  ).not.toBeChecked();
  if (await getFilterDrawer(page).isVisible()) {
    await toggleFilterDrawer(page);
  }

  // Sort order
  await expectSortSelected(page, sortCase, isMobile);

  // The URL, and so the pagination page
  const after = await captureSearchState(page);
  expect(after).toEqual(before);
}
