/**
 * Search page helper utilities.
 *
 * These helpers centralize how tests submit search queries and wait for
 * results to settle before asserting table rows.
 */

import { expect, type Page } from "@playwright/test";
import { waitForRowByColumns } from "tests/e2e/utils/common";
import {
  waitForSearchResultsReady,
  type SearchResultsWaitOptions,
} from "tests/e2e/utils/common/table-row-utils";

export type SearchOpportunityByValueOptions = {
  /** Optional overrides for shared search-results readiness waiting. */
  resultsReadyOptions?: SearchResultsWaitOptions;
};

/**
 * Executes a search by a single text value and waits for results readiness.
 *
 * Submission strategy:
 * - prefer a form-scoped Search button
 * - then a search-region Search button
 * - finally fallback to pressing Enter in the query input
 */
export async function searchOpportunityByValue(
  page: Page,
  searchValue: string,
  options: SearchOpportunityByValueOptions = {},
): Promise<void> {
  const searchInput = page.locator("#query");
  await expect(searchInput).toBeVisible();
  await searchInput.fill(searchValue);

  const searchForm = searchInput.locator("xpath=ancestor::form[1]");
  if (await searchForm.count()) {
    const searchButton = searchForm.getByRole("button", {
      name: "Search",
      exact: true,
    });

    if (await searchButton.count()) {
      if (await searchButton.isVisible().catch(() => false)) {
        const clicked = await searchButton
          .click({ timeout: 3000 })
          .then(() => true)
          .catch(() => false);

        if (!clicked) {
          await searchInput.press("Enter");
        }
      } else {
        // Button exists but is not currently interactable.
        await searchInput.press("Enter");
      }
    } else {
      // Form exists but submit button is not labeled/exposed as expected.
      await searchInput.press("Enter");
    }
  } else {
    const scopedSearchRegion = page
      .getByRole("search")
      .filter({ has: searchInput })
      .first();
    const regionButton = scopedSearchRegion.getByRole("button", {
      name: "Search",
      exact: true,
    });

    if (await regionButton.count()) {
      if (await regionButton.isVisible().catch(() => false)) {
        const clicked = await regionButton
          .click({ timeout: 3000 })
          .then(() => true)
          .catch(() => false);

        if (!clicked) {
          await searchInput.press("Enter");
        }
      } else {
        await searchInput.press("Enter");
      }
    } else {
      // Last-resort submit when markup does not expose a stable Search button.
      await searchInput.press("Enter");
    }
  }

  // Ensure URL query reflects the search value before waiting on results state.
  await page.waitForFunction(
    (value: string) => {
      const normalizeQuery = (text: string): string =>
        text.trim().replace(/\s+/g, " ");

      const query =
        new URL(window.location.href).searchParams.get("query") ?? "";
      return normalizeQuery(query) === normalizeQuery(value);
    },
    searchValue,
    { timeout: 15000 },
  );

  await waitForSearchResultsReady(page, {
    timeoutMs: 30000,
    searchInputSelector: "#query",
    ...(options.resultsReadyOptions ?? {}),
  });
}

/**
 * Navigates to Search, runs a query, and verifies the matching row fields.
 */
export async function verifyOpportunityInSearchByTitleAndNumber(
  page: Page,
  opportunityTitle: string,
  opportunityNumber: string,
  expectedStatus: string = "Open",
  expectedAgency: string | RegExp = /\S+/,
): Promise<void> {
  await page.goto("/search");
  await expect(page).toHaveURL(/\/search/);

  await searchOpportunityByValue(page, opportunityTitle);

  const matchingSearchRow = await waitForRowByColumns(page, {
    columnValues: {
      Title: opportunityTitle,
      Status: expectedStatus,
      Agency: expectedAgency,
    },
  });

  await expect(matchingSearchRow).toBeVisible();
  await expect(matchingSearchRow).toContainText(opportunityNumber);
}
