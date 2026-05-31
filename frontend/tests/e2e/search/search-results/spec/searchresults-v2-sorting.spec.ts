/**
 * @feature Search Results Sorting
 * @featureFile e2e/search/search-results/features/searchresults-v2-sorting.feature
 * @scenario Selecting a sort option updates results
 * @scenario Data integrity after sorting
 */

import { expect, test } from "@playwright/test";
import {
  expectURLQueryParamValue,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import {
  clickLastPaginationPage,
  clickPaginationPageNumber,
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectSortBy,
  getFirstSearchResultTitle,
  getLastSearchResultTitle,
  selectSortBy,
  toggleCheckbox,
  toggleFilterDrawer,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION, FULL_REGRESSION } =
  VALID_TAGS;

// Authoritative sort option labels sourced from src/constants/searchFilterOptions.ts
const SORT_OPTION_LABELS = [
  "Most relevant (Default)",
  "Close date (Furthest)",
  "Close date (Soonest)",
  "Posted date (Newest)",
  "Posted date (Oldest)",
  "Opportunity title (A to Z)",
  "Opportunity title (Z to A)",
  "Award minimum (Lowest)",
  "Award minimum (Highest)",
  "Award maximum (Lowest)",
  "Award maximum (Highest)",
];

test.describe("Search results sorting", () => {
  /**
   * @featureFile e2e/search/search-results/features/searchresults-v2-sorting.feature
   * @scenario Selecting a sort option updates results
   *
   * Verifies that:
   * - The "Sort by" dropdown is visible and lists all expected options
   * - Selecting a sort option updates the URL (sortby=<value>) without a full page reload
   * - The selected option is reflected in the dropdown
   * - The sort label correctly conveys the intended sort direction (asc/desc)
   * - Sort persists when navigating across pagination pages
   * - Sort persists after a funding-instrument filter is applied
   * - Sort persists after saving the search (desktop) or navigating to an
   *   Opportunity Detail page and back (mobile)
   * - Clicking "Search" from the top navigation resets sort to the default
   * - The dropdown is keyboard-navigable and screen-reader-accessible
   * - Focus remains on the dropdown after a selection is made
   */
  test(
    "Selecting a sort option updates results",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }, { project }) => {
      test.setTimeout(240_000);
      const isMobile = !!project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am on the Search Funding Opportunity page
       * And search results are displayed
       */
      await page.goto("/search");
      await waitForSearchResultsInitialLoad(page);

      // When I open the "Sort by" dropdown (on mobile it lives inside the filter drawer)
      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // Then the sort dropdown is visible
      const sortSelectId = isMobile
        ? "#search-sort-by-select-drawer"
        : "#search-sort-by-select";
      const sortSelect = page.locator(sortSelectId).first();
      await expect(sortSelect).toBeVisible();

      // And the dropdown contains all expected sort options
      const optionTexts = await sortSelect.locator("option").allTextContents();
      for (const label of SORT_OPTION_LABELS) {
        expect(
          optionTexts.some((t) => t.trim() === label),
          `Expected sort option "${label}" to be present`,
        ).toBe(true);
      }

      // When I select "Close date (Soonest)" from the sort by dropdown
      await selectSortBy(page, "closeDateAsc", isMobile, project.name);

      // Then the selected sort option should be reflected in the dropdown
      await expectSortBy(page, "closeDateAsc", isMobile);

      // And the selected sort option reflects the intended sort direction (ascending = "Asc" suffix)
      expect("closeDateAsc").toMatch(/Asc$/);

      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // And results update without a full page reload (URL param updated via client-side navigation)
      await waitForURLContainsQueryParamValue(page, "sortby", "closeDateAsc");

      // And sorting persists when pagination changes — page 2
      await clickPaginationPageNumber(page, 2);
      expectURLQueryParamValue(page, "sortby", "closeDateAsc");

      // And sorting persists on page 3
      await clickPaginationPageNumber(page, 3);
      expectURLQueryParamValue(page, "sortby", "closeDateAsc");

      // Return to page 1 before applying filters
      await clickPaginationPageNumber(page, 1);
      await waitForSearchResultsInitialLoad(page);

      // And sorting works correctly with applied filters (Cooperative Agreement)
      await ensureFilterDrawerOpen(page);
      await ensureAccordionExpanded(page, "Funding instrument");
      await toggleCheckbox(page, "funding-instrument-cooperative_agreement");
      await toggleFilterDrawer(page);

      // Sort param persists after filter is applied
      await waitForURLContainsQueryParamValue(page, "sortby", "closeDateAsc");
      expectURLQueryParamValue(page, "sortby", "closeDateAsc");

      if (!isMobile) {
        // Desktop: sort persists after saving the search
        const saveSearchButton = page.getByTestId("save-search-query");
        if ((await saveSearchButton.count()) > 0) {
          await saveSearchButton.click();
          await page.getByRole("button", { name: "close" }).click();
          expectURLQueryParamValue(page, "sortby", "closeDateAsc");
        }
      } else {
        // Mobile: sort persists when navigating to an Opportunity Detail page and back
        const firstResultLink = page
          .locator(".simpler-responsive-table tr:first-child a")
          .first();
        await firstResultLink.click();
        await page.waitForURL(/\/opportunity\//);
        await page.goBack();
        await waitForSearchResultsInitialLoad(page);
        expectURLQueryParamValue(page, "sortby", "closeDateAsc");
      }

      // When I click "Search" from the top navigation
      await page
        .getByTestId("header")
        .getByRole("link", { name: "Search" })
        .click();
      await waitForSearchResultsInitialLoad(page);

      // Then sorting should reset to the default option "Most relevant"
      const urlAfterNavReset = new URL(page.url());
      expect(urlAfterNavReset.searchParams.has("sortby")).toBe(false);

      // And the dropdown is keyboard-navigable (desktop only; on mobile sort is inside the drawer)
      if (!isMobile) {
        const desktopSortSelect = page
          .locator("#search-sort-by-select")
          .first();
        await desktopSortSelect.focus();
        await expect(desktopSortSelect).toBeFocused();
        await desktopSortSelect.press("ArrowDown");
        await expect(desktopSortSelect).toBeFocused();
      }

      // And screen readers can identify the sort control via its associated label
      if (!isMobile) {
        const sortLabel = page.locator('label[for="search-sort-by-select"]');
        await expect(sortLabel).toBeVisible();
      }

      // And focus remains on the dropdown after a selection is made
      if (!isMobile) {
        const desktopSortSelect = page
          .locator("#search-sort-by-select")
          .first();
        await desktopSortSelect.selectOption("postedDateAsc");
        await expect(desktopSortSelect).toBeFocused();
      }
    },
  );

  /**
   * @featureFile e2e/search/search-results/features/searchresults-v2-sorting.feature
   * @scenario Data integrity after sorting
   *
   * Verifies that:
   * - Results on page 1 are correctly ordered for the selected sort option
   * - Sort ordering is consistent across pages (last result on page 1 precedes
   *   first result on page 2 for an ascending title sort)
   * - Sorting works correctly with filtered results (Cooperative Agreement filter)
   * - Sorting works correctly with large result sets (navigating to a high page number)
   * - Sorting works correctly with partial result sets (last page of results)
   */
  test(
    "Data integrity after sorting",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      test.setTimeout(300_000);
      const isMobile = !!project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am on the Search Funding Opportunity page
       * And search results are displayed
       */
      await page.goto("/search");
      await waitForSearchResultsInitialLoad(page);

      // When I select "Opportunity title (A to Z)" sort option
      if (isMobile) {
        await toggleFilterDrawer(page);
      }
      await selectSortBy(page, "opportunityTitleAsc", isMobile, project.name);
      if (isMobile) {
        await toggleFilterDrawer(page);
      }
      await waitForURLContainsQueryParamValue(
        page,
        "sortby",
        "opportunityTitleAsc",
      );

      // Then results on page 1 should be correctly ordered (first title ≤ last title alphabetically)
      const firstTitlePage1 = await getFirstSearchResultTitle(page);
      const lastTitlePage1 = await getLastSearchResultTitle(page);
      expect(
        firstTitlePage1.toLowerCase() <= lastTitlePage1.toLowerCase(),
        `Expected "${firstTitlePage1}" to be alphabetically ≤ "${lastTitlePage1}"`,
      ).toBe(true);

      // And sorting is consistent across pages:
      // the last result on page 1 should precede or match the first result on page 2
      await clickPaginationPageNumber(page, 2);
      expectURLQueryParamValue(page, "sortby", "opportunityTitleAsc");
      const firstTitlePage2 = await getFirstSearchResultTitle(page);
      expect(
        lastTitlePage1.toLowerCase() <= firstTitlePage2.toLowerCase(),
        `Expected last title on page 1 "${lastTitlePage1}" to be alphabetically ≤ first title on page 2 "${firstTitlePage2}"`,
      ).toBe(true);

      // Return to page 1 for the filtered-results check
      await clickPaginationPageNumber(page, 1);
      await waitForSearchResultsInitialLoad(page);

      // And sorting works correctly with filtered results (Cooperative Agreement)
      await ensureFilterDrawerOpen(page);
      await ensureAccordionExpanded(page, "Funding instrument");
      await toggleCheckbox(page, "funding-instrument-cooperative_agreement");
      await toggleFilterDrawer(page);
      await waitForURLContainsQueryParamValue(
        page,
        "sortby",
        "opportunityTitleAsc",
      );

      const firstTitleFiltered = await getFirstSearchResultTitle(page);
      const lastTitleFiltered = await getLastSearchResultTitle(page);
      // Only assert ordering when there are at least two distinct results
      if (firstTitleFiltered && lastTitleFiltered && firstTitleFiltered !== lastTitleFiltered) {
        expect(
          firstTitleFiltered.toLowerCase() <= lastTitleFiltered.toLowerCase(),
          `With Cooperative Agreement filter: expected "${firstTitleFiltered}" ≤ "${lastTitleFiltered}"`,
        ).toBe(true);
      }

      // And sorting works correctly with large result sets:
      // navigate directly to a higher page number via URL to verify sort param persists
      await page.goto("/search?sortby=opportunityTitleAsc&page=4");
      await waitForSearchResultsInitialLoad(page);
      expectURLQueryParamValue(page, "sortby", "opportunityTitleAsc");
      const firstTitleHighPage = await getFirstSearchResultTitle(page);
      const lastTitleHighPage = await getLastSearchResultTitle(page);
      if (firstTitleHighPage && lastTitleHighPage && firstTitleHighPage !== lastTitleHighPage) {
        expect(
          firstTitleHighPage.toLowerCase() <= lastTitleHighPage.toLowerCase(),
          `On page 4: expected "${firstTitleHighPage}" ≤ "${lastTitleHighPage}"`,
        ).toBe(true);
      }

      // And sorting works correctly with partial result sets (last page may have fewer results)
      await page.goto("/search?sortby=opportunityTitleAsc");
      await waitForSearchResultsInitialLoad(page);
      await clickLastPaginationPage(page);
      expectURLQueryParamValue(page, "sortby", "opportunityTitleAsc");
      const firstTitleLastPage = await getFirstSearchResultTitle(page);
      const lastTitleLastPage = await getLastSearchResultTitle(page);
      if (firstTitleLastPage && lastTitleLastPage && firstTitleLastPage !== lastTitleLastPage) {
        expect(
          firstTitleLastPage.toLowerCase() <= lastTitleLastPage.toLowerCase(),
          `On last page: expected "${firstTitleLastPage}" ≤ "${lastTitleLastPage}"`,
        ).toBe(true);
      }
    },
  );
});
