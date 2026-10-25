// =========================
// Search Sort Test Helper Functions
// =========================

import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  openMobileNav,
  waitForURLChange,
  waitForURLContainsQueryParamValue,
  waitForURLContainsQueryParamValues,
} from "tests/e2e/playwrightUtils";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  toggleCheckbox,
  toggleFilterDrawer,
  type LoginState,
} from "tests/e2e/utils/search/search-filter-utils";
import {
  clickLastPaginationPage,
  clickPaginationPageIfPresent,
  expectSortBy,
  getNumberOfOpportunitySearchResults,
  getSortSelect,
  selectSortBy,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/search-utils";

const { targetEnv } = playwrightEnv;

const NAVIGATION_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

// Matches the page_size sent by buildPagination (src/utils/search/searchFormatUtils.ts).
export const SEARCH_PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Sort options (src/constants/searchFilterOptions.ts `sortOptions`)
// ---------------------------------------------------------------------------

export type SortKey =
  "closeDate" | "postedDate" | "title" | "awardMin" | "awardMax";
export type SortDirection = "asc" | "desc";

export type SortCase = {
  label: string;
  value: string;
  // null for relevancy: the score is not shown in the UI, so order can't be asserted
  key: SortKey | null;
  direction: SortDirection | null;
  // Login state per option, copied from the Examples table in searchresults-v2-sorting.feature
  loginState: LoginState;
};

export const DEFAULT_SORT: SortCase = {
  label: "Most relevant (Default)",
  value: "relevancy",
  key: null,
  direction: null,
  loginState: "logged in",
};

// Used to leave the default option before selecting it. Re-selecting the option that
// is already selected does not fire a change event.
export const NON_DEFAULT_SORT_VALUE = "closeDateAsc";

export const SORT_CASES: SortCase[] = [
  DEFAULT_SORT,
  {
    label: "Close date (Furthest)",
    value: "closeDateDesc",
    key: "closeDate",
    direction: "desc",
    loginState: "logged in",
  },
  {
    label: "Close date (Soonest)",
    value: "closeDateAsc",
    key: "closeDate",
    direction: "asc",
    loginState: "not logged in",
  },
  {
    label: "Posted date (Newest)",
    value: "postedDateDesc",
    key: "postedDate",
    direction: "desc",
    loginState: "not logged in",
  },
  {
    label: "Posted date (Oldest)",
    value: "postedDateAsc",
    key: "postedDate",
    direction: "asc",
    loginState: "logged in",
  },
  {
    label: "Opportunity title (A to Z)",
    value: "opportunityTitleAsc",
    key: "title",
    direction: "asc",
    loginState: "logged in",
  },
  {
    label: "Opportunity title (Z to A)",
    value: "opportunityTitleDesc",
    key: "title",
    direction: "desc",
    loginState: "not logged in",
  },
  {
    label: "Award minimum (Lowest)",
    value: "awardFloorAsc",
    key: "awardMin",
    direction: "asc",
    loginState: "not logged in",
  },
  {
    label: "Award minimum (Highest)",
    value: "awardFloorDesc",
    key: "awardMin",
    direction: "desc",
    loginState: "logged in",
  },
  {
    label: "Award maximum (Lowest)",
    value: "awardCeilingAsc",
    key: "awardMax",
    direction: "asc",
    loginState: "logged in",
  },
  {
    label: "Award maximum (Highest)",
    value: "awardCeilingDesc",
    key: "awardMax",
    direction: "desc",
    loginState: "not logged in",
  },
];

// ---------------------------------------------------------------------------
// Applying / asserting the selected sort
// ---------------------------------------------------------------------------

/**
 * Selects a sort option and waits for the URL and results to settle.
 * On mobile the sort select lives in the filter drawer, so the drawer is opened
 * for the selection and closed again afterwards.
 */
export async function applySortOption(
  page: Page,
  sortValue: string,
  isMobile: boolean,
  projectName?: string,
): Promise<void> {
  if (isMobile) {
    await ensureFilterDrawerOpen(page);
  }
  await selectSortBy(page, sortValue, isMobile, projectName);
  await waitForURLContainsQueryParamValue(page, "sortby", sortValue);
  if (isMobile) {
    await toggleFilterDrawer(page);
  }
  await getNumberOfOpportunitySearchResults(page);
}

/**
 * Asserts the dropdown shows the given option (value and visible label).
 */
export async function expectSortSelected(
  page: Page,
  sortCase: Pick<SortCase, "value" | "label">,
  isMobile: boolean,
): Promise<void> {
  if (isMobile) {
    await ensureFilterDrawerOpen(page);
  }
  await expectSortBy(page, sortCase.value, isMobile);
  const sortSelect = await getSortSelect(page, isMobile);
  await expect(sortSelect.locator("option:checked")).toHaveText(sortCase.label);
  if (isMobile) {
    await toggleFilterDrawer(page);
  }
}

export function expectNoSortInURL(page: Page): void {
  expect(new URL(page.url()).searchParams.get("sortby")).toBeNull();
}

export function expectSortInURL(page: Page, sortValue: string): void {
  expectURLQueryParamValue(page, "sortby", sortValue);
}

// ---------------------------------------------------------------------------
// No full page reload
// ---------------------------------------------------------------------------

const NO_RELOAD_MARKER = "__searchSortNoReloadMarker";

/**
 * Sets a flag on `window`. A full document reload wipes it; client-side
 * (Next router) navigation does not.
 */
export async function markPageSession(page: Page): Promise<void> {
  await page.evaluate((key) => {
    (window as unknown as Record<string, unknown>)[key] = true;
  }, NO_RELOAD_MARKER);
}

export async function expectNoFullPageReload(page: Page): Promise<void> {
  const markerSurvived = await page.evaluate(
    (key) => (window as unknown as Record<string, unknown>)[key] === true,
    NO_RELOAD_MARKER,
  );
  expect(
    markerSurvived,
    "Expected results to update without a full page reload",
  ).toBe(true);
}

// ---------------------------------------------------------------------------
// Reading results
// ---------------------------------------------------------------------------

export type ResultRow = {
  id: string; // href of the opportunity link, unique per opportunity
  title: string;
  closeDate: string; // "MMM D, YYYY" or "TBD"
  postedDate: string; // "MMM D, YYYY" or ""
  awardMin: string; // "$1,234", "$--" (none) or "" ($0)
  awardMax: string;
};

/**
 * Reads every row of the results table currently on screen. Uses textContent,
 * not innerText: the posted date is display:none below the tablet-lg breakpoint.
 */
export async function readResultRows(page: Page): Promise<ResultRow[]> {
  return page
    .locator(".simpler-responsive-table tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => {
        const clean = (text: string | null | undefined) =>
          (text ?? "").replace(/\s+/g, " ").trim();
        // Cells render in column order: close date, status, title, agency, award min, award max
        const cells = Array.from(
          row.querySelectorAll('[data-testid^="responsive-data-"]'),
        ).map((cell) => clean(cell.textContent));
        const link = row.querySelector<HTMLAnchorElement>(
          'a[id^="search-result-link-"]',
        );
        const postedDate =
          /([A-Z][a-z]{2} \d{1,2}, \d{4})/.exec(cells[3] ?? "")?.[1] ?? "";
        return {
          id: link?.getAttribute("href") ?? "",
          title: clean(link?.textContent),
          closeDate: cells[0] ?? "",
          postedDate,
          awardMin: cells[4] ?? "",
          awardMax: cells[5] ?? "",
        };
      }),
    );
}

function parseDate(text: string): number | null {
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : time;
}

function parseAward(text: string): number | null {
  if (text.includes("--")) return null;
  if (text === "") return 0; // formatCurrency(0) renders an empty string
  const amount = Number(text.replace(/[$,\s]/g, ""));
  return Number.isNaN(amount) ? null : amount;
}

function getSortValue(row: ResultRow, key: SortKey): number | string | null {
  switch (key) {
    case "closeDate":
      return parseDate(row.closeDate);
    case "postedDate":
      return parseDate(row.postedDate);
    case "title":
      return row.title;
    case "awardMin":
      return parseAward(row.awardMin);
    case "awardMax":
      return parseAward(row.awardMax);
  }
}

// ---------------------------------------------------------------------------
// Ordering assertions
// ---------------------------------------------------------------------------

type Comparator = (a: number | string, b: number | string) => number;

const compareNumbers: Comparator = (a, b) => Number(a) - Number(b);
const compareStrings: Comparator = (a, b) => {
  const left = String(a);
  const right = String(b);
  if (left < right) return -1;
  return left > right ? 1 : 0;
};
const compareStringsIgnoringCase: Comparator = (a, b) =>
  compareStrings(String(a).toLowerCase(), String(b).toLowerCase());

function findFirstViolation(
  values: (number | string)[],
  direction: SortDirection,
  compare: Comparator,
): number {
  for (let i = 1; i < values.length; i += 1) {
    const result = compare(values[i - 1], values[i]);
    // Non-strict: ties are allowed, and are common for dates and awards.
    if (direction === "asc" ? result > 0 : result < 0) {
      return i;
    }
  }
  return -1;
}

/**
 * Asserts rows are ordered for the sort option: non-strict ordering on the sorted
 * column, with rows that have no value (TBD close date, "$--" award) after all rows
 * that do. Relevancy is skipped (no visible score). Pass rows from consecutive pages
 * concatenated to also verify the page boundary.
 *
 * Title ordering passes if it holds either case-sensitively or case-insensitively,
 * since the search index collation is not defined in this repo.
 */
export function expectRowsSorted(
  rows: ResultRow[],
  sortCase: SortCase,
  context: string,
): void {
  const { key, direction } = sortCase;
  if (!key || !direction) return;

  const sortValues = rows.map((row) => getSortValue(row, key));

  const firstMissing = sortValues.findIndex((value) => value === null);
  if (firstMissing !== -1) {
    expect(
      sortValues.slice(firstMissing).every((value) => value === null),
      `${context}: rows with no ${key} value should sort after rows that have one ("${sortCase.label}")`,
    ).toBe(true);
  }

  const values = sortValues.filter(
    (value): value is number | string => value !== null,
  );
  const comparators: Comparator[] =
    key === "title"
      ? [compareStrings, compareStringsIgnoringCase]
      : [compareNumbers];
  const violations = comparators.map((compare) =>
    findFirstViolation(values, direction, compare),
  );
  const violationIndex = violations.every((index) => index !== -1)
    ? violations[0]
    : -1;

  expect(
    violationIndex,
    violationIndex === -1
      ? ""
      : `${context}: "${sortCase.label}" out of order at ${key} values ` +
          `#${violationIndex - 1} -> #${violationIndex}: ` +
          `"${values[violationIndex - 1]}" then "${values[violationIndex]}"`,
  ).toBe(-1);
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * With the sort already applied and results on page 1, walks pages 1..maxSequentialPages
 * (and the last page when there are more) and verifies:
 * - sortby stays in the URL
 * - full pages hold 25 rows and the last page holds the remainder
 * - rows are ordered on each page and across each page boundary
 * - no opportunity appears twice across the pages visited
 * Leaves the browser on the last page visited.
 */
export async function verifySortedAcrossPages(
  page: Page,
  sortCase: SortCase,
  label: string,
  expectedTotal: number,
  maxSequentialPages = 3,
): Promise<void> {
  const totalPages = Math.max(1, Math.ceil(expectedTotal / SEARCH_PAGE_SIZE));
  const visited: { pageNumber: number; rows: ResultRow[] }[] = [];

  const readCurrentPage = async (pageNumber: number) => {
    await getNumberOfOpportunitySearchResults(page);
    visited.push({ pageNumber, rows: await readResultRows(page) });
  };

  await readCurrentPage(1);

  for (let n = 2; n <= Math.min(totalPages, maxSequentialPages); n += 1) {
    const clicked = await clickPaginationPageIfPresent(
      page,
      n,
      "search-sort-utils",
    );
    expect(
      clicked,
      `${label}: expected a page ${n} for ${expectedTotal} results`,
    ).toBe(true);
    await readCurrentPage(n);
  }

  if (totalPages > maxSequentialPages) {
    await clickLastPaginationPage(page);
    const lastPageParam = Number(new URL(page.url()).searchParams.get("page"));
    expect(
      lastPageParam,
      `${label}: last pagination button should be page ${totalPages}`,
    ).toBe(totalPages);
    await readCurrentPage(totalPages);
  }

  expectSortInURL(page, sortCase.value);

  for (const { pageNumber, rows } of visited) {
    const expectedRowCount =
      pageNumber < totalPages
        ? SEARCH_PAGE_SIZE
        : expectedTotal - SEARCH_PAGE_SIZE * (totalPages - 1);
    expect(
      rows.length,
      `${label}: unexpected row count on page ${pageNumber}`,
    ).toBe(expectedRowCount);
    expectRowsSorted(rows, sortCase, `${label} page ${pageNumber}`);
  }

  for (let i = 1; i < visited.length; i += 1) {
    const previous = visited[i - 1];
    const current = visited[i];
    if (current.pageNumber === previous.pageNumber + 1) {
      expectRowsSorted(
        [...previous.rows, ...current.rows],
        sortCase,
        `${label} pages ${previous.pageNumber}-${current.pageNumber} boundary`,
      );
    }
  }

  const ids = visited.flatMap(({ rows }) => rows.map((row) => row.id));
  expect(ids.every(Boolean), `${label}: every row should have a link`).toBe(
    true,
  );
  expect(
    new Set(ids).size,
    `${label}: an opportunity appeared on more than one page`,
  ).toBe(ids.length);
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/**
 * Narrows results by unchecking the default "Forecasted" status (URL becomes status=posted).
 * Sorting must be retained and results must remain.
 */
export async function applyStatusNarrowingFilter(
  page: Page,
  isMobile: boolean,
): Promise<void> {
  await ensureFilterDrawerOpen(page);
  await ensureAccordionExpanded(page, "Opportunity status");
  await toggleCheckbox(page, "status-forecasted");
  await waitForURLContainsQueryParamValues(page, "status", ["posted"]);
  await waitForSearchResultsInitialLoad(page);
  if (isMobile) {
    await toggleFilterDrawer(page);
  }
  await getNumberOfOpportunitySearchResults(page);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Clicks "Search" in the top navigation. From /search this links to
 * /search?refresh=true, which drops sortby. Waits for sortby to leave the URL.
 */
export async function clickSearchFromTopNav(
  page: Page,
  isMobile: boolean,
): Promise<void> {
  if (isMobile) {
    await openMobileNav(page);
  }
  const searchLink = page
    .locator(".usa-nav")
    .getByRole("link", { name: "Search", exact: true })
    .first();
  await searchLink.click();

  await waitForURLChange(
    page,
    (url) => !new URL(url).searchParams.has("sortby"),
    NAVIGATION_TIMEOUT,
  );

  // The mobile nav can stay open after navigating and would intercept later clicks.
  const closeNavButton = page.locator(".usa-nav__close");
  if (await closeNavButton.isVisible().catch(() => false)) {
    await closeNavButton.click();
  }

  await waitForSearchResultsInitialLoad(page);
}

/**
 * Opens the first result's Opportunity Detail page, then returns with browser back.
 */
export async function openFirstResultAndGoBack(page: Page): Promise<void> {
  const firstResultLink = page.locator('a[id^="search-result-link-"]').first();
  await firstResultLink.click();
  await page.waitForURL(/\/opportunity\//, { timeout: NAVIGATION_TIMEOUT });

  await page.goBack({
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT,
  });
  await waitForSearchResultsInitialLoad(page);
}
