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
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectFilterDrawerClosed,
  getFilterDrawer,
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
  title: string; // whitespace-normalized, for messages
  rawTitle: string; // exactly as rendered, untrimmed: this is what the index sorts on
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
          rawTitle: link?.textContent ?? "",
          closeDate: cells[0] ?? "",
          postedDate,
          awardMin: cells[4] ?? "",
          awardMax: cells[5] ?? "",
        };
      }),
    );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Dates outside this range are bad data (staging has opportunities dated e.g. 0202 or 1920).
// Their position relative to real dates is not something this test can reason about.
const PLAUSIBLE_YEAR_RANGE = { min: 1990, max: 2100 };

/**
 * Parses "MMM D, YYYY" exactly. Date.parse is not used because it silently remaps short
 * years ("Jan 1, 0020" becomes 2020, "0050" becomes 1950).
 */
function parseDate(text: string): number | null {
  const match = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(text.trim());
  if (!match) return null;
  const month = MONTHS.indexOf(match[1]);
  if (month < 0) return null;
  const date = new Date(0);
  date.setUTCFullYear(Number(match[3]), month, Number(match[2]));
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
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
      return row.rawTitle;
    case "awardMin":
      return parseAward(row.awardMin);
    case "awardMax":
      return parseAward(row.awardMax);
  }
}

/**
 * Whether the row's value has a position this test can verify. Rows with a value that
 * is present but not verifiable are left out of the ordering check.
 */
function isVerifiable(value: number | string, key: SortKey): boolean {
  if (key === "closeDate" || key === "postedDate") {
    const year = new Date(Number(value)).getUTCFullYear();
    return year >= PLAUSIBLE_YEAR_RANGE.min && year <= PLAUSIBLE_YEAR_RANGE.max;
  }
  if (key === "title") {
    // Collation of titles that start with whitespace or punctuation is implementation defined.
    return /^[\p{L}\p{N}]/u.test(String(value));
  }
  return true;
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
// Case, accents and punctuation ignored.
const toLooseTitle = (value: number | string) =>
  String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
const compareStringsLoosely: Comparator = (a, b) =>
  compareStrings(toLooseTitle(a), toLooseTitle(b));

type Entry = { row: ResultRow; index: number; value: number | string };

function findFirstViolation(
  entries: Entry[],
  direction: SortDirection,
  compare: Comparator,
): number {
  for (let i = 1; i < entries.length; i += 1) {
    const result = compare(entries[i - 1].value, entries[i].value);
    // Non-strict: ties are allowed, and are common for dates and awards.
    if (direction === "asc" ? result > 0 : result < 0) {
      return i;
    }
  }
  return -1;
}

const describeRow = (row: ResultRow) =>
  JSON.stringify({
    title: row.rawTitle,
    closeDate: row.closeDate,
    postedDate: row.postedDate,
    awardMin: row.awardMin,
    awardMax: row.awardMax,
  });

/**
 * Asserts rows are ordered for the sort option: non-strict ordering on the sorted
 * column, with rows that have no value (TBD close date, "$--" award) after all rows
 * that do. Relevancy is skipped (no visible score). Pass rows from consecutive pages
 * concatenated to also verify the page boundary.
 *
 * Environments differ in data, so rows whose value cannot be verified are left out of
 * the check (see isVerifiable): dates outside a plausible year range, and titles that
 * start with whitespace or punctuation. Title ordering passes if it holds exactly,
 * ignoring case, or ignoring case/accents/punctuation, since the search index collation
 * is not defined in this repo.
 */
export function expectRowsSorted(
  rows: ResultRow[],
  sortCase: SortCase,
  context: string,
): void {
  const { key, direction } = sortCase;
  if (!key || !direction) return;

  const entries = rows.map((row, index) => ({
    row,
    index,
    value: getSortValue(row, key),
  }));

  const firstMissing = entries.findIndex((entry) => entry.value === null);
  if (firstMissing !== -1) {
    expect(
      entries.slice(firstMissing).every((entry) => entry.value === null),
      `${context}: rows with no ${key} value should sort after rows that have one ("${sortCase.label}")`,
    ).toBe(true);
  }

  const present = entries.filter(
    (entry): entry is Entry => entry.value !== null,
  );
  const verifiable = present.filter((entry) => isVerifiable(entry.value, key));
  if (verifiable.length !== present.length) {
    console.warn(
      `${context}: ${present.length - verifiable.length} of ${present.length} rows ` +
        `have a ${key} value that can't be verified and were left out of the ordering check`,
    );
  }

  const comparators: Comparator[] =
    key === "title"
      ? [compareStrings, compareStringsIgnoringCase, compareStringsLoosely]
      : [compareNumbers];
  const violations = comparators.map((compare) =>
    findFirstViolation(verifiable, direction, compare),
  );
  const violationIndex = violations.every((index) => index !== -1)
    ? violations[0]
    : -1;

  expect(
    violationIndex,
    violationIndex === -1
      ? ""
      : `${context}: "${sortCase.label}" out of order between rows ` +
          `#${verifiable[violationIndex - 1].index} and #${verifiable[violationIndex].index}: ` +
          `${describeRow(verifiable[violationIndex - 1].row)} then ` +
          `${describeRow(verifiable[violationIndex].row)}`,
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
 * Unchecks a checkbox that is currently checked. toggleCheckbox in search-filter-utils
 * only ever checks (it returns early when the box is already checked), so it can't
 * be used for default filters such as Forecasted.
 */
async function uncheckCheckbox(page: Page, idWithoutHash: string) {
  const checkBox = page.locator(`input[id="${idWithoutHash}"]`).first();
  const checkBoxLabel = page
    .locator(`label[for="${idWithoutHash}"]:visible`)
    .first();
  const timeout = targetEnv !== "local" ? 120000 : 30000;
  await checkBox.waitFor({ state: "attached", timeout });
  await checkBoxLabel.waitFor({ state: "visible", timeout });
  await checkBoxLabel.scrollIntoViewIfNeeded();
  await expect(checkBox).toBeEnabled();
  await expect(
    checkBox,
    `Expected ${idWithoutHash} to be checked by default`,
  ).toBeChecked();

  await checkBoxLabel.click({ force: true });
  await expect(checkBox).not.toBeChecked({ timeout: 10000 });
}

async function closeFilterDrawerIfOpen(page: Page): Promise<void> {
  if (await getFilterDrawer(page).isVisible()) {
    await toggleFilterDrawer(page);
  }
  await expectFilterDrawerClosed(page);
}

/**
 * Narrows results by unchecking the default "Forecasted" status (URL becomes status=posted).
 * Sorting must be retained and results must remain.
 *
 * Filter checkboxes update the URL with setQueryParam, which (unlike a sort or
 * keyword change) does not remove the `page` param. If a page param is left over,
 * reload without it so callers always start from page 1 of the filtered results.
 */
export async function applyStatusNarrowingFilter(page: Page): Promise<void> {
  await ensureFilterDrawerOpen(page);
  await ensureAccordionExpanded(page, "Opportunity status");
  await uncheckCheckbox(page, "status-forecasted");
  await waitForURLContainsQueryParamValues(page, "status", ["posted"]);
  await waitForSearchResultsInitialLoad(page);
  // The drawer is a modal on every viewport. Left open it intercepts clicks on the
  // results, pagination and save search button, so close it (as save-search.spec.ts does).
  await closeFilterDrawerIfOpen(page);
  await getNumberOfOpportunitySearchResults(page);

  const url = new URL(page.url());
  if (url.searchParams.has("page")) {
    url.searchParams.delete("page");
    await gotoWithRetry(page, url.toString(), { timeout: NAVIGATION_TIMEOUT });
    await waitForSearchResultsInitialLoad(page);
    await getNumberOfOpportunitySearchResults(page);
  }
}

// ---------------------------------------------------------------------------
// Partial result sets
// ---------------------------------------------------------------------------

/**
 * Finds a keyword that returns a partial result set (fewer results than one page) on whatever
 * data the target environment has, and leaves the browser on that search.
 *
 * Seed data differs between environments (the "SGG" keyword returns a handful of results locally
 * but hundreds on staging), so the preferred keyword is tried first. The fallback uses titles of
 * opportunities on the default search page: keyword search defaults to AND, so a title (or its
 * first words) only matches a few opportunities. A set of 2 or more is preferred so ordering is
 * meaningful; a set of 1 is accepted if that is all there is.
 */
export async function gotoPartialResultsSearch(
  page: Page,
  baseUrl: string,
  preferredTerm: string,
): Promise<{ term: string; count: number }> {
  const attempted: string[] = [];
  let singleResultMatch: { term: string; count: number } | undefined;

  const tryTerm = async (term: string) => {
    await gotoWithRetry(
      page,
      `${baseUrl}/search?query=${encodeURIComponent(term)}`,
      { timeout: NAVIGATION_TIMEOUT },
    );
    await waitForSearchResultsInitialLoad(page);
    const count = await getNumberOfOpportunitySearchResults(page);
    attempted.push(`"${term}" -> ${count}`);
    if (count >= 2 && count <= SEARCH_PAGE_SIZE) {
      return { term, count };
    }
    if (count === 1 && !singleResultMatch) {
      singleResultMatch = { term, count };
    }
    return undefined;
  };

  const preferred = await tryTerm(preferredTerm);
  if (preferred) return preferred;

  await gotoWithRetry(page, `${baseUrl}/search`, {
    timeout: NAVIGATION_TIMEOUT,
  });
  await waitForSearchResultsInitialLoad(page);
  const titles = (await readResultRows(page)).map((row) => row.title);

  const candidates = titles
    .slice(0, 5)
    .flatMap((title) => [title.split(/\s+/).slice(0, 3).join(" "), title])
    .filter(
      (term, index, all) => term.length > 0 && all.indexOf(term) === index,
    );

  for (const term of candidates) {
    const found = await tryTerm(term);
    if (found) return found;
  }

  if (singleResultMatch) {
    // Go back to it so the browser is on the search that is returned.
    await tryTerm(singleResultMatch.term);
    return singleResultMatch;
  }

  throw new Error(
    "Could not find a keyword returning a partial result set (1-" +
      `${SEARCH_PAGE_SIZE} results). Tried: ${attempted.join("; ")}`,
  );
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
