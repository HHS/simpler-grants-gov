/**
 * Waits for and interacts with table rows in list views.
 * Preferred reusable APIs for list pages:
 * - waitForRowByColumns: match by any number of columns.
 * - waitForRowByColumnPair: convenience wrapper for exactly two columns.
 * - clickRowLinkByText: open a row link by visible link text.
 */

import { expect, type Locator, type Page } from "@playwright/test";

import { escapeRegex } from "./regex-utils";

type ColumnValue = string | RegExp;
type TableColumnValues = Record<string, ColumnValue>;

type RowWaitPollingOptions = {
  rowSelector?: string;
  timeoutMs?: number;
  intervalsMs?: number[];
  message?: string;
  pollingPreset?: "auto" | "default" | "search";
  reloadEveryAttempts?: number;
  reloadHeading?: string | RegExp;
  enableAuthCheck?: boolean;
};

type RowColumnsMatchOptions = RowWaitPollingOptions & {
  columnValues: TableColumnValues;
  requireUniqueMatch?: boolean;
};

type RowColumnPairMatchOptions = RowWaitPollingOptions & {
  firstColumn: string;
  firstValue: ColumnValue;
  secondColumn: string;
  secondValue: ColumnValue;
};

export type SearchResultsSelectors = {
  table: string;
  emptyState: string;
  resultsScope: string;
  structuralLoading: string;
  statusElements: string;
  statusAndTextElements: string;
  resultItems: string;
};

export type SearchResultsWaitOptions = {
  timeoutMs?: number;
  searchInputSelector?: string;
  selectorOverrides?: Partial<SearchResultsSelectors>;
};

// Shared selector semantics for Search results readiness/loading checks.
// Keep these centralized so future DOM refactors only require one update point.
export const SEARCH_RESULTS_SELECTORS = {
  table: '[data-testid="table"], [role="table"], [role="grid"], table',
  emptyState:
    '[data-testid*="no-results"], [data-testid*="empty-state"], [data-testid*="zero-state"], [data-testid*="no-data"]',
  resultsScope:
    '[data-testid*="results"], [data-testid*="search-results"], [aria-label*="results" i], [role="region"], main, section',
  structuralLoading:
    '[aria-busy="true"], [role="progressbar"], [data-testid*="loading"], [data-testid*="spinner"]',
  statusElements: '[role="status"], [role="alert"], [aria-live]',
  statusAndTextElements:
    '[role="status"], [role="alert"], [aria-live], div, span, p',
  resultItems: 'tbody tr, [role="row"], li, article',
} as const satisfies SearchResultsSelectors;

const normalizeColumnName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const toPrintableValue = (value: ColumnValue): string =>
  value instanceof RegExp ? value.source : value;

const toNumericComparable = (value: string): string =>
  value.replace(/[$,\s]/g, "");

const isNumericLike = (value: string): boolean =>
  /^\$?[\d,]+(?:\.\d+)?$/.test(value.trim());

const buildNumericContainsPattern = (value: string): RegExp => {
  const normalized = toNumericComparable(value);

  // Allow optional currency symbols/commas in table text while preserving digit order.
  const digitPattern = normalized
    .split("")
    .map((char) => `${escapeRegex(char)}[\\s,]*`)
    .join("");

  return new RegExp(`(?:^|[^0-9])\\$*\\s*${digitPattern}(?:[^0-9]|$)`, "i");
};

const toColumnPattern = (value: ColumnValue): RegExp => {
  if (value instanceof RegExp) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return /^.*$/;
  }

  if (isNumericLike(trimmed)) {
    return buildNumericContainsPattern(trimmed);
  }

  // Use case-insensitive contains matching so partial values can narrow rows.
  return new RegExp(escapeRegex(trimmed), "i");
};

const getColumnIndexMapFromTable = async (
  table: Locator,
): Promise<Map<string, { name: string; index: number }>> => {
  const byName = new Map<string, { name: string; index: number }>();

  const headerTexts = await table.locator("thead th").allTextContents();

  headerTexts.forEach((headerText, index) => {
    const name = headerText.trim();
    if (!name) {
      return;
    }
    byName.set(normalizeColumnName(name), { name, index });
  });

  const responsiveHeaders = table.locator(
    '[data-testid^="responsive-header-"]',
  );
  const responsiveHeaderCount = await responsiveHeaders.count();

  for (let i = 0; i < responsiveHeaderCount; i += 1) {
    const header = responsiveHeaders.nth(i);
    const rawName = (await header.textContent()) ?? "";
    const name = rawName.trim();
    const testId = (await header.getAttribute("data-testid")) ?? "";
    const match = testId.match(/-(\d+)$/);
    const index = match ? Number(match[1]) : Number.NaN;

    if (!name || Number.isNaN(index)) {
      continue;
    }

    const normalized = normalizeColumnName(name);
    if (!byName.has(normalized)) {
      byName.set(normalized, { name, index });
    }
  }

  return byName;
};

/** Builds a normalized map of visible table header labels to their column index. */
const getColumnIndexMap = async (
  page: Page,
): Promise<Map<string, { name: string; index: number }>> => {
  const preferredTable = page.getByTestId("table").first();
  const table =
    (await preferredTable.count()) > 0
      ? preferredTable
      : page.locator("table").first();
  return getColumnIndexMapFromTable(table);
};

const resolveTableForColumns = async (
  page: Page,
  requiredColumns: string[],
): Promise<{
  table: Locator;
  columnIndexMap: Map<string, { name: string; index: number }>;
} | null> => {
  const normalizedRequiredColumns = requiredColumns.map(normalizeColumnName);
  const allTables = page.locator("table");
  const allCount = await allTables.count();

  let fallbackMatch: {
    table: Locator;
    columnIndexMap: Map<string, { name: string; index: number }>;
  } | null = null;
  let fallbackMatchPreferred = false;
  let bestVisibleMatch: {
    table: Locator;
    columnIndexMap: Map<string, { name: string; index: number }>;
    visibleRowCount: number;
    preferred: boolean;
  } | null = null;

  for (let i = 0; i < allCount; i += 1) {
    const table = allTables.nth(i);
    const preferred =
      ((await table.getAttribute("data-testid")) ?? "").toLowerCase() ===
      "table";
    const columnIndexMap = await getColumnIndexMapFromTable(table);
    const hasAllRequiredColumns = normalizedRequiredColumns.every(
      (columnName) => columnIndexMap.has(columnName),
    );

    if (!hasAllRequiredColumns) {
      continue;
    }

    if (await table.isVisible().catch(() => false)) {
      const rows = table.locator("tbody tr");
      const totalRows = await rows.count();
      let visibleRowCount = 0;

      for (let i = 0; i < totalRows; i += 1) {
        if (
          await rows
            .nth(i)
            .isVisible()
            .catch(() => false)
        ) {
          visibleRowCount += 1;
        }
      }

      const shouldReplaceBest =
        !bestVisibleMatch ||
        visibleRowCount > bestVisibleMatch.visibleRowCount ||
        (visibleRowCount === bestVisibleMatch.visibleRowCount &&
          preferred &&
          !bestVisibleMatch.preferred);

      if (shouldReplaceBest) {
        bestVisibleMatch = {
          table,
          columnIndexMap,
          visibleRowCount,
          preferred,
        };
      }

      continue;
    }

    if (!fallbackMatch || (preferred && !fallbackMatchPreferred)) {
      fallbackMatch = { table, columnIndexMap };
      fallbackMatchPreferred = preferred;
    }
  }

  if (bestVisibleMatch) {
    return {
      table: bestVisibleMatch.table,
      columnIndexMap: bestVisibleMatch.columnIndexMap,
    };
  }

  return fallbackMatch;
};

const isSearchResultsTableReady = async (page: Page): Promise<boolean> => {
  return page.evaluate((selectors) => {
    const isVisible = (element: Element | null): boolean => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    };

    const searchInputElement = document.querySelector("#query");
    const searchContainer =
      searchInputElement?.closest("form, [role='search'], section, main") ??
      null;
    const rootScope =
      searchContainer?.closest("main, section, [role='main']") ?? document.body;
    const queryInScope = (selector: string): Element | null =>
      rootScope.querySelector(selector);

    const tableLike = queryInScope(selectors.table);
    const emptyStateElement = queryInScope(selectors.emptyState);
    const resultsAnchor = tableLike ?? emptyStateElement;
    const resultsScope =
      resultsAnchor?.closest(selectors.resultsScope) ??
      searchContainer?.parentElement ??
      rootScope;

    const visibleResultItems = Array.from(
      resultsScope.querySelectorAll(selectors.resultItems),
    ).some((element) => isVisible(element));

    if (visibleResultItems) {
      return true;
    }

    if (!isVisible(tableLike)) {
      return false;
    }

    const hasHeader = !!tableLike?.querySelector(
      "thead th, [role='columnheader']",
    );
    const hasRows =
      (tableLike?.querySelectorAll(selectors.resultItems).length ?? 0) > 0;

    return hasHeader || hasRows;
  }, SEARCH_RESULTS_SELECTORS);
};

const getSearchResultRowsLocator = async (
  page: Page,
  rowSelector: string,
): Promise<Locator> => {
  const normalizedRowSelector = rowSelector.trim().toLowerCase();
  const defaultRowSelector = normalizedRowSelector === "tbody tr";
  const searchRowSelector = defaultRowSelector
    ? SEARCH_RESULTS_SELECTORS.resultItems
    : `${rowSelector}, ${SEARCH_RESULTS_SELECTORS.resultItems}`;

  const searchInput = page.locator("#query").first();
  if ((await searchInput.count()) > 0) {
    const searchRoot = searchInput
      .locator(
        "xpath=ancestor::*[self::main or self::section or @role='main'][1]",
      )
      .first();

    if ((await searchRoot.count()) > 0) {
      return searchRoot.locator(searchRowSelector);
    }
  }

  const searchResultsScope = page
    .locator(SEARCH_RESULTS_SELECTORS.resultsScope)
    .first();
  if ((await searchResultsScope.count()) > 0) {
    return searchResultsScope.locator(searchRowSelector);
  }

  return page.locator(searchRowSelector);
};

/**
 * Waits until Search results settle into one of these states:
 * - results table rendered with rows
 * - rendered table with zero rows
 * - visible no-results/empty-state message
 */
export const waitForSearchResultsReady = async (
  page: Page,
  options: SearchResultsWaitOptions = {},
): Promise<void> => {
  const {
    timeoutMs = 30000,
    searchInputSelector = "#query",
    selectorOverrides,
  } = options;

  const mergedSelectors: SearchResultsSelectors = {
    ...SEARCH_RESULTS_SELECTORS,
    ...(selectorOverrides ?? {}),
  };

  await page.waitForFunction(
    ({ selectors, searchInput }) => {
      const isVisible = (element: Element | null): boolean => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return false;
        }

        return element.getClientRects().length > 0;
      };

      const searchInputElement = document.querySelector(searchInput);
      const searchContainer =
        searchInputElement?.closest("form, [role='search'], section, main") ??
        null;
      const rootScope =
        searchContainer?.closest("main, section, [role='main']") ??
        document.body;

      const queryInScope = (selector: string): Element | null =>
        rootScope.querySelector(selector);

      const table =
        queryInScope(selectors.table) ??
        searchContainer?.parentElement?.querySelector(selectors.table) ??
        null;
      const emptyStateElement = queryInScope(selectors.emptyState);
      const resultsAnchor = table ?? emptyStateElement;
      const resultsScope =
        resultsAnchor?.closest(selectors.resultsScope) ??
        searchContainer?.parentElement ??
        rootScope;

      const queryAllInResults = (selector: string): Element[] =>
        Array.from(resultsScope.querySelectorAll(selector));

      const structuralLoadingVisible = queryAllInResults(
        selectors.structuralLoading,
      ).some((element) => isVisible(element));

      const loadingElements = queryAllInResults(
        selectors.statusAndTextElements,
      );
      const loadingTextVisible = loadingElements.some((element) => {
        if (!isVisible(element)) {
          return false;
        }

        const text = (element.textContent ?? "").trim().toLowerCase();
        return /loading(?:\s+the)?\s+(?:table|results)/.test(text);
      });

      const loadingVisible = structuralLoadingVisible || loadingTextVisible;

      const emptyStateVisible = queryAllInResults(selectors.emptyState).some(
        (element) => isVisible(element),
      );

      const noResultsVisible =
        emptyStateVisible ||
        queryAllInResults(selectors.statusElements).some((element) => {
          if (!isVisible(element)) {
            return false;
          }

          const text = (element.textContent ?? "").trim().toLowerCase();
          return /no\s+results|didn'?t\s+return\s+any\s+results|0\s+results|no\s+(?:records|items|data)/.test(
            text,
          );
        });

      const tableHasHeader = !!table?.querySelector("thead th");
      const tableHasBody = !!table?.querySelector("tbody");
      const tableRowCount =
        table?.querySelectorAll(selectors.resultItems).length ?? 0;
      const tableReady = isVisible(table) && tableRowCount > 0;

      const listReady =
        !table &&
        queryAllInResults(selectors.resultItems).some((element) =>
          isVisible(element),
        );

      // Treat an empty rendered table as a completed search state to avoid
      // depending on no-results copy text changes.
      const tableEmptyReady =
        isVisible(table) &&
        tableHasHeader &&
        tableHasBody &&
        tableRowCount === 0;

      return (
        !loadingVisible &&
        (tableReady || tableEmptyReady || listReady || noResultsVisible)
      );
    },
    {
      selectors: mergedSelectors,
      searchInput: searchInputSelector,
    },
    { timeout: timeoutMs },
  );
};

/** Applies all provided column filters and returns the matching row locator set. */
const getMatchingRowsByColumnsLocator = async (
  page: Page,
  rowSelector: string,
  columnValues: TableColumnValues,
  options?: { throwOnMissingColumns?: boolean },
): Promise<Locator> => {
  const { throwOnMissingColumns = true } = options ?? {};
  const resolvedTable = await resolveTableForColumns(
    page,
    Object.keys(columnValues),
  );

  if (!resolvedTable) {
    if (!throwOnMissingColumns) {
      return page.locator('[data-testid="__never_match__"]');
    }

    const availableColumns = Array.from(
      (await getColumnIndexMap(page)).values(),
    )
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.name)
      .join(", ");

    throw new Error(
      `One or more columns were not found. Requested: ${Object.keys(columnValues).join(", ")}. Available columns: ${availableColumns}`,
    );
  }

  const { table, columnIndexMap } = resolvedTable;

  let rows = table.locator(rowSelector);

  for (const [columnName, expectedValue] of Object.entries(columnValues)) {
    const columnMeta = columnIndexMap.get(normalizeColumnName(columnName));

    if (!columnMeta) {
      const availableColumns = Array.from(columnIndexMap.values())
        .sort((a, b) => a.index - b.index)
        .map((entry) => entry.name)
        .join(", ");

      if (!throwOnMissingColumns) {
        return page.locator('[data-testid="__never_match__"]');
      }

      throw new Error(
        `Column "${columnName}" was not found. Available columns: ${availableColumns}`,
      );
    }

    const pattern = toColumnPattern(expectedValue);
    const byResponsiveData = rows
      .locator(
        `td [data-testid^="responsive-data-"][data-testid$="-${columnMeta.index}"]`,
      )
      .filter({ hasText: pattern });
    const byNthCell = rows
      .locator(`td:nth-child(${columnMeta.index + 1})`)
      .filter({ hasText: pattern });

    rows = rows.filter({ has: byResponsiveData.or(byNthCell) });
  }

  return rows;
};

/**
 * Performs deterministic row matching by checking each row's cells directly.
 * This avoids false negatives from complex locator-composition inside polling loops.
 */
const getMatchingRowsInfo = async (
  page: Page,
  rowSelector: string,
  columnValues: TableColumnValues,
  options?: { throwOnMissingColumns?: boolean },
): Promise<{ count: number; firstRow: Locator | null }> => {
  const { throwOnMissingColumns = true } = options ?? {};
  const resolvedTable = await resolveTableForColumns(
    page,
    Object.keys(columnValues),
  );

  if (!resolvedTable) {
    if (!throwOnMissingColumns) {
      return { count: 0, firstRow: null };
    }

    const availableColumns = Array.from(
      (await getColumnIndexMap(page)).values(),
    )
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.name)
      .join(", ");

    throw new Error(
      `One or more columns were not found. Requested: ${Object.keys(columnValues).join(", ")}. Available columns: ${availableColumns}`,
    );
  }

  const { table, columnIndexMap } = resolvedTable;
  const rows = table.locator(rowSelector);

  const columnChecks = Object.entries(columnValues).map(
    ([columnName, expectedValue]) => {
      const columnMeta = columnIndexMap.get(normalizeColumnName(columnName));

      if (!columnMeta) {
        const availableColumns = Array.from(columnIndexMap.values())
          .sort((a, b) => a.index - b.index)
          .map((entry) => entry.name)
          .join(", ");

        if (!throwOnMissingColumns) {
          return null;
        }

        throw new Error(
          `Column "${columnName}" was not found. Available columns: ${availableColumns}`,
        );
      }

      const pattern = toColumnPattern(expectedValue);
      return {
        index: columnMeta.index,
        source: pattern.source,
        flags: pattern.flags,
      };
    },
  );

  if (columnChecks.some((check) => check === null)) {
    return { count: 0, firstRow: null };
  }

  const matchingIndexes = await rows.evaluateAll(
    (rowElements, checks) => {
      const isRenderedRow = (element: Element): boolean => {
        const hiddenAncestor = element.closest(
          '[hidden], [aria-hidden="true"], .is-hidden',
        );
        if (hiddenAncestor) {
          return false;
        }

        if (!(element instanceof HTMLElement)) {
          return false;
        }

        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          return false;
        }

        return element.getClientRects().length > 0;
      };

      return rowElements
        .map((rowElement, rowIndex) => {
          if (!isRenderedRow(rowElement)) {
            return -1;
          }

          const rowMatches = checks.every((check) => {
            const pattern = new RegExp(check.source, check.flags);

            const responsiveCells = rowElement.querySelectorAll(
              `td [data-testid^="responsive-data-"][data-testid$="-${check.index}"]`,
            );
            const hasResponsiveMatch = Array.from(responsiveCells).some(
              (cell) => pattern.test(cell.textContent ?? ""),
            );

            if (hasResponsiveMatch) {
              return true;
            }

            const tableCell = rowElement.querySelector(
              `td:nth-child(${check.index + 1})`,
            );
            return pattern.test(tableCell?.textContent ?? "");
          });

          return rowMatches ? rowIndex : -1;
        })
        .filter((rowIndex) => rowIndex >= 0);
    },
    columnChecks as Array<{ index: number; source: string; flags: string }>,
  );

  if (matchingIndexes.length === 0) {
    return { count: 0, firstRow: null };
  }

  return {
    count: matchingIndexes.length,
    firstRow: rows.nth(matchingIndexes[0]),
  };
};

/**
 * Fallback row matcher using Playwright locators.
 * Slower than evaluateAll but more resilient to transient rendered state changes.
 */
const getMatchingRowsFallbackInfo = async (
  page: Page,
  rowSelector: string,
  columnValues: TableColumnValues,
  options?: { throwOnMissingColumns?: boolean },
): Promise<{ count: number; firstRow: Locator | null }> => {
  const rows = await getMatchingRowsByColumnsLocator(
    page,
    rowSelector,
    columnValues,
    options,
  );
  const total = await rows.count();
  let visibleCount = 0;
  let firstVisibleRow: Locator | null = null;

  for (let i = 0; i < total; i += 1) {
    const row = rows.nth(i);
    const isVisible = await row.isVisible().catch(() => false);

    if (!isVisible) {
      continue;
    }

    visibleCount += 1;
    if (!firstVisibleRow) {
      firstVisibleRow = row;
    }
  }

  return {
    count: visibleCount,
    firstRow: firstVisibleRow,
  };
};

/**
 * Last-resort matcher that checks full row text only.
 * Used when column-scoped matchers cannot stabilize in streamed/hydrated table states.
 */
const getMatchingRowsByRowTextInfo = async (
  page: Page,
  rowSelector: string,
  columnValues: TableColumnValues,
): Promise<{ count: number; firstRow: Locator | null }> => {
  const tableLike = page.locator(SEARCH_RESULTS_SELECTORS.table).first();
  const normalizedRowSelector = rowSelector.trim().toLowerCase();
  const defaultRowSelector = normalizedRowSelector === "tbody tr";

  const rows =
    (await tableLike.count()) > 0
      ? defaultRowSelector
        ? tableLike.locator('tbody tr, [role="row"]')
        : tableLike.locator(rowSelector)
      : (await inferPollingPreset(page)) === "search"
        ? await getSearchResultRowsLocator(page, rowSelector)
        : page.locator(rowSelector);

  const rowPatterns = Object.values(columnValues).map((value) => {
    const pattern = toColumnPattern(value);
    return { source: pattern.source, flags: pattern.flags };
  });

  const matchingIndexes = await rows.evaluateAll((rowElements, checks) => {
    const isRenderedRow = (element: Element): boolean => {
      const hiddenAncestor = element.closest(
        '[hidden], [aria-hidden="true"], .is-hidden',
      );
      if (hiddenAncestor) {
        return false;
      }

      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    };

    return rowElements
      .map((rowElement, rowIndex) => {
        if (!isRenderedRow(rowElement)) {
          return -1;
        }

        const rowText = rowElement.textContent ?? "";
        const rowMatches = checks.every((check) =>
          new RegExp(check.source, check.flags).test(rowText),
        );
        return rowMatches ? rowIndex : -1;
      })
      .filter((rowIndex) => rowIndex >= 0);
  }, rowPatterns);

  if (matchingIndexes.length === 0) {
    return { count: 0, firstRow: null };
  }

  return {
    count: matchingIndexes.length,
    firstRow: rows.nth(matchingIndexes[0]),
  };
};

const isSearchTableLoading = async (page: Page): Promise<boolean> => {
  return page.evaluate((selectors) => {
    const isVisible = (element: Element | null): boolean => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    };

    const table = document.querySelector(selectors.table);
    const emptyState = document.querySelector(selectors.emptyState);
    const anchor = table ?? emptyState;
    const resultsScope =
      anchor?.closest(selectors.resultsScope) ?? document.body;

    const structuralLoadingVisible = Array.from(
      resultsScope.querySelectorAll(selectors.structuralLoading),
    ).some((element) => isVisible(element));

    if (structuralLoadingVisible) {
      return true;
    }

    return Array.from(
      resultsScope.querySelectorAll(selectors.statusAndTextElements),
    ).some((element) => {
      if (!isVisible(element)) {
        return false;
      }

      const text = (element.textContent ?? "").trim().toLowerCase();
      return /loading(?:\s+the)?\s+(?:table|results)/.test(text);
    });
  }, SEARCH_RESULTS_SELECTORS);
};

/** Formats the uniqueness error when multiple rows match the same filter set. */
const buildAmbiguousMatchError = (
  columnName: string,
  value: ColumnValue,
  count: number,
): string => {
  const printableValue = toPrintableValue(value);

  return `Found ${count} matches for "${printableValue}" under "${columnName}" column. Add more column filters to match a single row.`;
};

/** Chooses the most informative column/value pair for ambiguity error details. */
const getBestAmbiguousColumn = async (
  page: Page,
  rowSelector: string,
  columnValues: TableColumnValues,
  finalCount: number,
): Promise<{ columnName: string; value: ColumnValue }> => {
  const entries = Object.entries(columnValues);

  for (const [columnName, value] of entries) {
    const singleCount = await (
      await getMatchingRowsByColumnsLocator(page, rowSelector, {
        [columnName]: value,
      })
    ).count();

    if (singleCount === finalCount) {
      return { columnName, value };
    }
  }

  const [columnName, value] = entries[0];
  return { columnName, value };
};

/**
 * Waits until a table row matches the provided column/value filters.
 *
 * Behavior:
 * - Supports 1..N columns via columnValues.
 * - Uses case-insensitive contains matching for string values.
 * - Supports currency-tolerant numeric matching.
 * - Can reload periodically while polling to recover from stale list state.
 * - Can check likely logged-out state and fail early in long waits.
 * - Returns the first matching row.
 * - Throws when requireUniqueMatch is true and multiple rows match.
 */
export const waitForRowByColumns = async (
  page: Page,
  options: RowColumnsMatchOptions,
): Promise<Locator> => {
  const {
    columnValues,
    rowSelector = "tbody tr",
    timeoutMs = 90000,
    intervalsMs = [1000, 2000, 5000],
    message = "Waiting for matching table row to appear",
    requireUniqueMatch = true,
    pollingPreset = "auto",
    reloadEveryAttempts,
    reloadHeading,
    enableAuthCheck,
  } = options;

  const resolvedPreset =
    pollingPreset === "auto" ? await inferPollingPreset(page) : pollingPreset;

  const presetDefaults =
    resolvedPreset === "search"
      ? {
          reloadEveryAttempts: 0,
          reloadHeading: undefined,
          // Search pages can render partial signed-out UI while hydrating.
          // Auth checks here create false positives during hydration.
          enableAuthCheck: false,
        }
      : {
          reloadEveryAttempts: 3,
          reloadHeading: undefined,
          enableAuthCheck: true,
        };

  const effectiveReloadEveryAttempts =
    reloadEveryAttempts ?? presetDefaults.reloadEveryAttempts;
  const effectiveReloadHeading = reloadHeading ?? presetDefaults.reloadHeading;
  const effectiveEnableAuthCheck =
    enableAuthCheck ?? presetDefaults.enableAuthCheck;

  let pollAttempt = 0;
  let logoutSignalCount = 0;

  await expect
    .poll(
      async () => {
        pollAttempt += 1;

        if (resolvedPreset === "search") {
          const resultsTableReady = await isSearchResultsTableReady(page);
          if (!resultsTableReady) {
            return 0;
          }
        }

        const searchLoadingVisible =
          resolvedPreset === "search" && (await isSearchTableLoading(page));

        // Search can briefly show stale loading text while results are already rendered.
        // Keep polling for rows even when this flag is true.

        if (searchLoadingVisible) {
          logoutSignalCount = 0;
        } else if (
          effectiveEnableAuthCheck &&
          (await isLikelyLoggedOut(page))
        ) {
          logoutSignalCount += 1;
          if (logoutSignalCount >= 2) {
            throw new Error(
              "Authentication appears to be lost while waiting for table row",
            );
          }
        } else {
          logoutSignalCount = 0;
        }

        const matchingRows = await getMatchingRowsInfo(
          page,
          rowSelector,
          columnValues,
          { throwOnMissingColumns: false },
        );
        let rowCount = matchingRows.count;

        if (rowCount === 0) {
          // Fall back to locator-driven matching if fast scan did not detect rows.
          rowCount = (
            await getMatchingRowsFallbackInfo(page, rowSelector, columnValues, {
              throwOnMissingColumns: false,
            })
          ).count;
        }

        if (rowCount === 0) {
          rowCount = (
            await getMatchingRowsByRowTextInfo(page, rowSelector, columnValues)
          ).count;
        }

        if (rowCount > 0) {
          return rowCount;
        }

        if (
          effectiveReloadEveryAttempts > 0 &&
          pollAttempt % effectiveReloadEveryAttempts === 0
        ) {
          await page.reload({ waitUntil: "domcontentloaded" });
          await page.waitForLoadState("load").catch(() => undefined);
          if (effectiveReloadHeading) {
            await expect(
              page
                .getByRole("heading", { name: effectiveReloadHeading })
                .first(),
            )
              .toBeVisible({ timeout: 10000 })
              .catch(() => undefined);
          }

          if (effectiveEnableAuthCheck && (await isLikelyLoggedOut(page))) {
            logoutSignalCount += 1;
            if (logoutSignalCount >= 2) {
              throw new Error(
                "Authentication appears to be lost after reloading while waiting for table row",
              );
            }
          } else {
            logoutSignalCount = 0;
          }
        }

        return (
          await getMatchingRowsInfo(page, rowSelector, columnValues, {
            throwOnMissingColumns: false,
          })
        ).count;
      },
      {
        message,
        timeout: timeoutMs,
        intervals: intervalsMs,
      },
    )
    .toBeGreaterThan(0);

  const matchingRows = await getMatchingRowsInfo(
    page,
    rowSelector,
    columnValues,
  );
  let finalCount = matchingRows.count;
  let firstRow = matchingRows.firstRow;

  if (finalCount === 0 || !firstRow) {
    const fallbackRows = await getMatchingRowsFallbackInfo(
      page,
      rowSelector,
      columnValues,
    );
    finalCount = fallbackRows.count;
    firstRow = fallbackRows.firstRow;
  }

  if (finalCount === 0 || !firstRow) {
    const textFallbackRows = await getMatchingRowsByRowTextInfo(
      page,
      rowSelector,
      columnValues,
    );
    finalCount = textFallbackRows.count;
    firstRow = textFallbackRows.firstRow;
  }

  if (requireUniqueMatch && finalCount > 1) {
    const bestColumn = await getBestAmbiguousColumn(
      page,
      rowSelector,
      columnValues,
      finalCount,
    );
    throw new Error(
      buildAmbiguousMatchError(
        bestColumn.columnName,
        bestColumn.value,
        finalCount,
      ),
    );
  }

  if (!firstRow) {
    throw new Error("No matching rows found after polling completed");
  }

  return firstRow;
};

/**
 * Infers polling behavior from page context.
 * Search page should avoid list-specific reload/auth heuristics.
 */
const inferPollingPreset = async (
  page: Page,
): Promise<"default" | "search"> => {
  if (/\/search(?:$|[/?#])/i.test(page.url())) {
    return "search";
  }

  const searchLandmarkVisible = await page
    .getByRole("search")
    .first()
    .isVisible()
    .catch(() => false);

  return searchLandmarkVisible ? "search" : "default";
};

/** Detects probable logged-out state while polling long-running table updates. */
const isLikelyLoggedOut = async (page: Page): Promise<boolean> => {
  if (/\/(sign-in|login|auth)(?:\/|$|\?)/i.test(page.url())) {
    return true;
  }

  // Scope to live status announcements to avoid matching hidden/template text.
  const sessionExpiredNotice = page
    .locator('[role="status"], [role="alert"], [aria-live]')
    .filter({
      hasText:
        /logged\s*out|session\s+expired|sign\s*in\s*again|authentication\s+required/i,
    })
    .first();

  const accountButton = page
    .getByRole("button", { name: /account|profile|my\s+account/i })
    .first();
  const signInLink = page.getByRole("link", { name: /sign in/i }).first();
  const signInHeading = page
    .getByRole("heading", { name: /sign in|log in/i })
    .first();

  const [
    hasSessionExpiredNotice,
    hasAccountButton,
    hasSignInLink,
    hasSignInHeading,
  ] = await Promise.all([
    sessionExpiredNotice.isVisible().catch(() => false),
    accountButton.isVisible().catch(() => false),
    signInLink.isVisible().catch(() => false),
    signInHeading.isVisible().catch(() => false),
  ]);

  return (
    hasSessionExpiredNotice ||
    (!hasAccountButton && (hasSignInLink || hasSignInHeading))
  );
};

/**
 * Convenience helper for exactly two column filters.
 * Use waitForRowByColumns when you need 1 filter or 3+ filters.
 */
export const waitForRowByColumnPair = async (
  page: Page,
  options: RowColumnPairMatchOptions,
): Promise<Locator> => {
  const {
    firstColumn,
    firstValue,
    secondColumn,
    secondValue,
    rowSelector,
    timeoutMs,
    intervalsMs,
    message = `Waiting for table row with ${firstColumn} and ${secondColumn}`,
  } = options;

  const row = await waitForRowByColumns(page, {
    columnValues: {
      [firstColumn]: firstValue,
      [secondColumn]: secondValue,
    },
    rowSelector,
    timeoutMs,
    intervalsMs,
    message,
  });

  await expect(row).toBeVisible({ timeout: 30000 });

  return row;
};

/**
 * Clicks a row link by visible text.
 * Attempts role=link first, then falls back to exact text.
 */
export const clickRowLinkByText = async (
  row: Locator,
  title: string,
): Promise<void> => {
  const titleLink = row.getByRole("link", {
    name: title,
    exact: true,
  });

  if (await titleLink.count()) {
    await titleLink.first().click();
    return;
  }

  await row.getByText(title, { exact: true }).first().click();
};
