/**
 * @feature Save Search Button - Search Results Table
 * @scenario Saved search restores query, filters, sort order, and resets pagination
 *
 * Split into two tests because no single criteria set reliably supports both
 * pagination reset (>25 results) and consistent query/filter/sort restoration
 * across all environments.
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  expectURLQueryParamValues,
  waitForURLContainsQueryParamValue,
  waitForURLContainsQueryParamValues,
} from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import {
  navigateToSavedSearches,
  runSavedSearch,
  saveCurrentSearch,
} from "tests/e2e/utils/search/save-search-utils";
import {
  clickPaginationPageIfPresent,
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectCheckboxesChecked,
  expectSortBy,
  fillSearchInputAndSubmit,
  getNumberOfOpportunitySearchResults,
  getSearchInput,
  selectSortBy,
  toggleCheckbox,
  toggleFilterDrawer,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/searchSpecUtil";
 
const { SMOKE, GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;
 
const { baseUrl, targetEnv } = playwrightEnv;
const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

const sortValue = "awardCeilingDesc";
 
test.describe("Saved search - restores state on reopen", () => {
  test(
    "reopening a saved search resets pagination to page 1",
    { tag: [SMOKE, GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      test.setTimeout(300_000);
      const isMobile = !!testInfo.project.name.match(/[Mm]obile/);
      const savedSearchName = `E2E Save Search Restore Pagination ${Date.now()}`;
 
      /**
       * @background
       * Given I am logged in
       */
      await authenticateE2eUser(page, context, isMobile);

      /**
       * @given I have saved a search with keywords, filters, and sort order
       */
      await gotoWithRetry(page, `${baseUrl}/search`, {
        timeout: GOTO_TIMEOUT,
      });
      await waitForSearchResultsInitialLoad(page);

       // On mobile, sort is accessed via the filter drawer, so open it first
      if (isMobile) {
        await ensureFilterDrawerOpen(page);
      }
 
      // Apply a sort order
      await selectSortBy(page, sortValue, isMobile, testInfo.project.name);
      await waitForURLContainsQueryParamValue(page, "sortby", sortValue);
 
      // Close the drawer on mobile so it stops intercepting clicks on the results below it
      if (isMobile) {
        await toggleFilterDrawer(page);
      }
 
      // Capture the result count to verify the saved search returns matching results.
      const expectedResultCount =
        await getNumberOfOpportunitySearchResults(page);
 
      // Start on page 2 to verify pagination resets when the saved search is reopened.
      const wentToPage2 = await clickPaginationPageIfPresent(
        page,
        2,
        "save-search.spec",
      );
      expect(
        wentToPage2,
        "Expected more than one page of results in the default catalog, " +
          "to actually exercise pagination-reset-on-reopen. If this starts " +
          "failing, the local/CI/staging seed data no longer has enough " +
          "posted/forecasted opportunities - see file header comment.",
      ).toBe(true);
 
      // On mobile, scroll to top of page to ensure save button is accessible
      if (isMobile) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
      }
 
      // Save the search and get the confirmation modal's Workspace link.
      const workspaceLink = await saveCurrentSearch(page, savedSearchName);
 
      /**
       * @when I reopen the saved search
       */
      await navigateToSavedSearches(page, workspaceLink);
 
      // Verify the saved search is listed in the workspace.
      const savedSearchListLink = page.getByRole("link", {
        name: savedSearchName,
        exact: true,
      });
      await expect(savedSearchListLink).toBeVisible();
 
      // Reopen the saved search - the list item's name link is the "Run" affordance
      await runSavedSearch(page, savedSearchName);
 
      /**
       * And pagination should reset to page 1
       */
      const currentUrl = new URL(page.url());
      expect(currentUrl.searchParams.get("page")).toBeNull();
      const currentPageButton = page
        .locator(".usa-pagination__button.usa-current")
        .first();
      if (await currentPageButton.isVisible().catch(() => false)) {
        await expect(currentPageButton).toHaveAttribute(
          "aria-label",
          /page 1/i,
        );
      }
 
      /**
       * And the results should match the search that was saved
       */
      const resultCountAfterReopen =
        await getNumberOfOpportunitySearchResults(page);
      expect(resultCountAfterReopen).toEqual(expectedResultCount);
    },
  );
  test(
    "reopening a saved search restores query, filters, and sort order",
    { tag: [SMOKE, GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      test.setTimeout(300_000);
      const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

      // "SGG" provides a small, stable, non-zero result set for verifying restoration.
      const searchTerm = "SGG";
      const statusFilter = { "status-closed": "closed" };
      const savedSearchName = `E2E Save Search Restore Criteria ${Date.now()}`;

      /**
       * @background
       * Given I am logged in
       */
      await authenticateE2eUser(page, context, isMobile);

      /**
       * @given I have saved a search with keywords, filters, and sort order
       */
      await gotoWithRetry(page, `${baseUrl}/search`, {
        timeout: GOTO_TIMEOUT,
      });
      await waitForSearchResultsInitialLoad(page);

      // Apply a keyword
      await fillSearchInputAndSubmit(searchTerm, page, testInfo.project.name);
      await waitForURLContainsQueryParamValue(page, "query", searchTerm);

      // Apply a status filter. This is additive on top of the default
      // statuses (forecasted, posted), so it can only add matches, never
      // remove them - safe to combine with the keyword above.
      await ensureFilterDrawerOpen(page);
      await ensureAccordionExpanded(page, "Opportunity status");
      await toggleCheckbox(page, "status-closed");
      await waitForURLContainsQueryParamValues(page, "status", [
        "closed",
        "forecasted",
        "posted",
      ]);
      await waitForSearchResultsInitialLoad(page);

      // Close the drawer so it stops intercepting clicks on the results below it
      await toggleFilterDrawer(page);

      // On mobile, sort is accessed via the filter drawer, so open it first
      if (isMobile) {
        await ensureFilterDrawerOpen(page);
      }

      // Apply a sort order
      await selectSortBy(page, sortValue, isMobile, testInfo.project.name);
      await waitForURLContainsQueryParamValue(page, "sortby", sortValue);

      // Close the drawer on mobile so it stops intercepting clicks below it
      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      // Capture the result count to verify the saved search returns matching results.
      const expectedResultCount =
        await getNumberOfOpportunitySearchResults(page);
      expect(
        expectedResultCount,
        `Expected at least one result for searchTerm="${searchTerm}" - if ` +
          "this starts failing, the seed data no longer includes matching " +
          "opportunities, see file header comment.",
      ).toBeGreaterThan(0);

      // On mobile, scroll to top of page to ensure save button is accessible
      if (isMobile) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
      }

      // Save the search and get the confirmation modal's Workspace link.
      const workspaceLink = await saveCurrentSearch(page, savedSearchName);

      /**
       * @when I reopen the saved search
       */
      await navigateToSavedSearches(page, workspaceLink);

      // Verify the saved search is listed in the workspace.
      const savedSearchListLink = page.getByRole("link", {
        name: savedSearchName,
        exact: true,
      });
      await expect(savedSearchListLink).toBeVisible();

      // Reopen the saved search - the list item's name link is the "Run" affordance
      await runSavedSearch(page, savedSearchName);

      /**
       * Then the search query should be restored
       */
      expectURLQueryParamValue(page, "query", searchTerm);
      const searchInput = getSearchInput(page);
      await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });

      /**
       * And filters should be restored
       */
      expectURLQueryParamValues(page, "status", [
        "closed",
        "forecasted",
        "posted",
      ]);
      await ensureFilterDrawerOpen(page);
      await ensureAccordionExpanded(page, "Opportunity status");
      await expectCheckboxesChecked(page, statusFilter);

      /**
       * And sort order should be restored
       */
      expectURLQueryParamValue(page, "sortby", sortValue);
      if (isMobile) {
        await ensureFilterDrawerOpen(page);
      }
      await expectSortBy(page, sortValue, isMobile);
      if (isMobile) {
        await toggleFilterDrawer(page);
      }

      /**
       * And the results should match the search that was saved
       */
      const resultCountAfterReopen =
        await getNumberOfOpportunitySearchResults(page);
      expect(resultCountAfterReopen).toEqual(expectedResultCount);
    },
  );
});

