/**
 * @feature Search Results Sorting – General Behavior - Search Results Table
 * @featureFile e2e/search/search-results/features/searchresults-v2-sorting.feature
 * @useCase Grantee Regression Use Case 5 (Sort Search Results), ACs 5.1–5.5
 *
 * @scenario Selecting a sort option updates results
 *    Test 1: one test per sort option.
 * @scenario Data integrity after sorting
 *    Test 2: one test per sort option.
 *
 * Viewport comes from the Playwright project (Chrome = desktop, Mobile chrome = mobile).
 * Login state per option follows the Examples table in the feature file.
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import {
  deleteAllSavedSearches,
  navigateToSavedSearches,
  runSavedSearch,
  saveCurrentSearch,
} from "tests/e2e/utils/search/save-search-utils";
import {
  ensureFilterDrawerOpen,
  gotoSearchPage,
  toggleFilterDrawer,
} from "tests/e2e/utils/search/search-filter-utils";
import {
  applySortOption,
  applyStatusNarrowingFilter,
  clickSearchFromTopNav,
  DEFAULT_SORT,
  expectNoFullPageReload,
  expectNoSortInURL,
  expectRowsSorted,
  expectSortInURL,
  expectSortSelected,
  markPageSession,
  NON_DEFAULT_SORT_VALUE,
  openFirstResultAndGoBack,
  readResultRows,
  SEARCH_PAGE_SIZE,
  SORT_CASES,
  verifySortedAcrossPages,
} from "tests/e2e/utils/search/search-sort-utils";
import {
  clickPaginationPageIfPresent,
  getNumberOfOpportunitySearchResults,
  getSortSelect,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/search-utils";

const { DISCOVERY, FULL_REGRESSION } = VALID_TAGS;

const { baseUrl, targetEnv } = playwrightEnv;
const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

// "SGG" gives a small, stable, non-zero result set (also used by save-search.spec.ts).
const PARTIAL_RESULTS_SEARCH_TERM = "SGG";

test.describe("Search results sorting", () => {
  for (const sortCase of SORT_CASES) {
    test(
      `selecting a sort option updates results - ${sortCase.label} (${sortCase.loginState})`,
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context, browserName }, testInfo) => {
        test.setTimeout(300_000);
        const projectName = testInfo.project.name;
        const isMobile = !!projectName.match(/[Mm]obile/);
        const canSaveSearch = !isMobile && sortCase.loginState === "logged in";

        /**
         * @background
         * Given I am on the Search Funding Opportunity page
         * And search results are displayed
         * And my login state is "<loginState>"
         */
        await gotoSearchPage(page, context, testInfo, sortCase.loginState);
        if (canSaveSearch) {
          await deleteAllSavedSearches(page);
        }

        // The default sort is "Most relevant", with no sortby in the URL.
        expectNoSortInURL(page);
        await expectSortSelected(page, DEFAULT_SORT, isMobile);
        const baselineCount = await getNumberOfOpportunitySearchResults(page);
        expect(baselineCount).toBeGreaterThan(0);

        /**
         * @when I open the "Sort by" dropdown
         * @and I select "<sortOption>" from the dropdown
         */
        await markPageSession(page);
        // Selecting the option that is already selected fires no change event.
        if (sortCase.value === DEFAULT_SORT.value) {
          await applySortOption(
            page,
            NON_DEFAULT_SORT_VALUE,
            isMobile,
            projectName,
          );
        }
        await applySortOption(page, sortCase.value, isMobile, projectName);

        /**
         * @then results should be reordered according to "<sortOption>"
         */
        const firstPageRows = await readResultRows(page);
        expect(firstPageRows.length).toBeGreaterThan(0);
        expectRowsSorted(firstPageRows, sortCase, "page 1");
        // Sorting reorders results; it never changes how many there are.
        expect(await getNumberOfOpportunitySearchResults(page)).toBe(
          baselineCount,
        );

        /**
         * @and results should update without a full page reload
         */
        await expectNoFullPageReload(page);

        /**
         * @and the selected sort option should be reflected in the dropdown
         */
        expectSortInURL(page, sortCase.value);
        await expectSortSelected(page, sortCase, isMobile);

        /**
         * @and the selected sort option reflects the intended sort direction
         * The ordering assertion above checks the rows; this checks the option itself.
         */
        if (sortCase.direction) {
          expect(sortCase.value.endsWith("Asc")).toBe(
            sortCase.direction === "asc",
          );
        }

        /**
         * @and sorting persists when pagination changes
         */
        const wentToPage2 = await clickPaginationPageIfPresent(
          page,
          2,
          "searchresults-v2-sorting.spec",
        );
        expect(
          wentToPage2,
          "Expected more than one page of results in the default catalog, " +
            "to exercise sort persistence across pagination. If this starts " +
            "failing, the seed data no longer has enough opportunities",
        ).toBe(true);
        await getNumberOfOpportunitySearchResults(page);
        expectSortInURL(page, sortCase.value);
        expectURLQueryParamValue(page, "page", "2");
        await expectSortSelected(page, sortCase, isMobile);
        const secondPageRows = await readResultRows(page);
        expectRowsSorted(secondPageRows, sortCase, "page 2");
        // Page 1 and page 2 together must continue the same order.
        expectRowsSorted(
          [...firstPageRows, ...secondPageRows],
          sortCase,
          "pages 1-2 boundary",
        );

        /**
         * @and sorting works correctly with applied filters
         * The helper returns on page 1 of the filtered results with sortby kept.
         */
        await applyStatusNarrowingFilter(page);
        const filteredCount = await getNumberOfOpportunitySearchResults(page);
        expect(
          filteredCount,
          "Expected results after unchecking Forecasted status",
        ).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThanOrEqual(baselineCount);
        expectSortInURL(page, sortCase.value);
        expect(new URL(page.url()).searchParams.get("page")).toBeNull();
        await expectSortSelected(page, sortCase, isMobile);
        expectRowsSorted(
          await readResultRows(page),
          sortCase,
          "filtered results",
        );

        if (canSaveSearch) {
          /**
           * @and sorting persists after saving the search if "<viewport>" is "desktop"
           * Saving needs a logged in user, so this only runs for logged in options.
           */
          const savedSearchName = `E2E Sort Persist ${sortCase.value} ${Date.now()}`;
          const workspaceLink = await saveCurrentSearch(page, savedSearchName);
          await navigateToSavedSearches(page, workspaceLink);
          await runSavedSearch(page, savedSearchName);

          expectSortInURL(page, sortCase.value);
          await expectSortSelected(page, sortCase, isMobile);
          expectRowsSorted(
            await readResultRows(page),
            sortCase,
            "reopened saved search",
          );
        }

        if (isMobile) {
          /**
           * @and sorting persists when navigating to an Opportunity Detail page
           *      and back if "<viewport>" is "mobile"
           */
          await openFirstResultAndGoBack(page);

          expectSortInURL(page, sortCase.value);
          await expectSortSelected(page, sortCase, isMobile);
          expectRowsSorted(
            await readResultRows(page),
            sortCase,
            "after returning from Opportunity Detail",
          );
        }

        /**
         * @when I click "Search" from the top navigation
         * @then sorting should reset to the default option "Most relevant"
         */
        await clickSearchFromTopNav(page, isMobile);
        expectNoSortInURL(page);
        await expectSortSelected(page, DEFAULT_SORT, isMobile);

        /**
         * @and the dropdown is keyboard-navigable
         * @and screen readers announce the selected sort option
         * @and focus remains on the dropdown after selection
         */
        if (isMobile) {
          await ensureFilterDrawerOpen(page);
        }
        const sortSelect = await getSortSelect(page, isMobile);

        // A native <select> with a <label>: the accessible name and selected option
        // are what assistive technology announces.
        await expect(sortSelect).toHaveAccessibleName("Sort by");
        await expect(sortSelect.locator("option:checked")).toHaveText(
          DEFAULT_SORT.label,
        );

        await sortSelect.focus();
        await expect(sortSelect).toBeFocused();

        // Arrow-key selection on a closed native <select> is only reliable in Chromium on
        // desktop; the mobile drawer is touch-driven.
        if (!isMobile && browserName === "chromium") {
          const nextSort = SORT_CASES[1];
          await page.keyboard.press("ArrowDown");
          await waitForURLContainsQueryParamValue(
            page,
            "sortby",
            nextSort.value,
          );
          await expect(sortSelect.locator("option:checked")).toHaveText(
            nextSort.label,
          );
          await expect(
            sortSelect,
            "Focus should remain on the Sort by dropdown after selection",
          ).toBeFocused();
        }

        if (isMobile) {
          await toggleFilterDrawer(page);
        }
      },
    );

    test(
      `data integrity after sorting - ${sortCase.label} (${sortCase.loginState})`,
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(300_000);
        const projectName = testInfo.project.name;
        const isMobile = !!projectName.match(/[Mm]obile/);

        const selectSort = async () => {
          // Selecting the option that is already selected fires no change event.
          if (sortCase.value === DEFAULT_SORT.value) {
            await applySortOption(
              page,
              NON_DEFAULT_SORT_VALUE,
              isMobile,
              projectName,
            );
          }
          await applySortOption(page, sortCase.value, isMobile, projectName);
        };

        /**
         * @background
         * Given I am on the Search Funding Opportunity page
         * And search results are displayed
         * And my login state is "<loginState>"
         */
        await gotoSearchPage(page, context, testInfo, sortCase.loginState);

        /**
         * @when I select "<sortOption>"
         * @then results should be correctly ordered based on "<sortOption>"
         * @and sorting works correctly with large result sets
         * @and sorting produces consistent ordering across pages
         * The default catalog spans multiple pages.
         */
        const largeCount = await getNumberOfOpportunitySearchResults(page);
        expect(
          largeCount,
          "Expected more than one page of results in the default catalog. " +
            "If this starts failing, the seed data no longer has enough opportunities",
        ).toBeGreaterThan(SEARCH_PAGE_SIZE);

        await selectSort();
        expect(await getNumberOfOpportunitySearchResults(page)).toBe(
          largeCount,
        );
        await verifySortedAcrossPages(
          page,
          sortCase,
          "large result set",
          largeCount,
        );

        /**
         * @and sorting works correctly with filtered results
         * The helper returns on page 1 of the filtered results with sortby kept.
         */
        await applyStatusNarrowingFilter(page);
        const filteredCount = await getNumberOfOpportunitySearchResults(page);
        expect(
          filteredCount,
          "Expected results after unchecking Forecasted status",
        ).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThanOrEqual(largeCount);
        expectSortInURL(page, sortCase.value);
        await verifySortedAcrossPages(
          page,
          sortCase,
          "filtered results",
          filteredCount,
        );

        /**
         * @and sorting works correctly with partial result sets
         * A search term that returns less than one full page.
         */
        await gotoWithRetry(
          page,
          `${baseUrl}/search?query=${PARTIAL_RESULTS_SEARCH_TERM}`,
          { timeout: GOTO_TIMEOUT },
        );
        await waitForSearchResultsInitialLoad(page);
        const partialCount = await getNumberOfOpportunitySearchResults(page);
        expect(
          partialCount,
          `Expected a small result set for "${PARTIAL_RESULTS_SEARCH_TERM}". ` +
            "If this starts failing, the seed data changed",
        ).toBeGreaterThan(0);
        expect(partialCount).toBeLessThanOrEqual(SEARCH_PAGE_SIZE);

        await selectSort();
        expect(await getNumberOfOpportunitySearchResults(page)).toBe(
          partialCount,
        );
        await verifySortedAcrossPages(
          page,
          sortCase,
          "partial result set",
          partialCount,
        );
      },
    );
  }
});
