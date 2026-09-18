/**
 * @featureArea Search
 * @feature Save Search Button – Search Results Table
 * @featureFile e2e/search/search-results/features/searchresults-v2-save-search.feature
 * @scenario Saved search restores query, filters, sort order, and resets pagination
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates a seeded test user (spoofed session, same mechanism as other
 *    authenticated specs in this suite).
 * 2) On the Search page, applies a keyword, a status filter, and a sort order, then
 *    navigates to page 2 of the results.
 * 3) Saves the search with a unique name via the "Save" modal.
 * 4) Follows the confirmation modal's "Workspace" link and confirms the new saved
 *    search is listed (AC: newly saved search is listed in workspace).
 * 5) Clicks the saved search to reopen/re-run it (the workspace list item's name is
 *    itself the "Run" affordance - see SavedSearchesList.tsx, there is no separate
 *    "Run" button in the current UI) and asserts:
 *    - the search query is restored
 *    - the status filter is restored
 *    - the sort order is restored
 *    - pagination resets to page 1, even though the search was saved from page 2
 *    - the result count matches the originally saved search (AC: matching results)
 *
 * Tester parameter guide:
 * - Search helpers (fill/sort/filter/pagination) are in tests/e2e/utils/search/searchSpecUtil.ts
 * - URL query param assertions are in tests/e2e/playwrightUtils.ts
 * - Test user is authenticated via tests/e2e/utils/auth/authenticate-e2e-user-utils.ts
 */

import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  expectURLQueryParamValues,
  waitForURLContainsQueryParamValue,
  waitForURLContainsQueryParamValues,
} from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import {
  clickPaginationPageNumber,
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

const { SMOKE,GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const { baseUrl, targetEnv } = playwrightEnv;
const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

const searchTerm = "education";
const sortValue = "awardCeilingDesc";
const statusFilter = { "status-closed": "closed" };
const savedSearchName = `E2E Save Search Restore ${Date.now()}`;

const goToSearch = async (page: Page) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(`${baseUrl}/search`, { timeout: GOTO_TIMEOUT });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // Chromium can intermittently throw ERR_NETWORK_CHANGED while the
      // dev server is starting or reloading; retry once to stabilize.
      if (message.includes("ERR_NETWORK_CHANGED") && attempt < 2) {
        await page.waitForTimeout(1000);
        continue;
      }
      throw error;
    }
  }
};

test.describe("Saved search - restores state on reopen", () => {
  test(
    "reopening a saved search restores query, filters, sort order, and resets pagination",
    { tag: [SMOKE, GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
      test.setTimeout(300_000);
      const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am logged in
       */
      await authenticateE2eUser(page, context, isMobile);

      /**
       * @given I have saved a search with keywords, filters, and sort order
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // Apply a keyword
      await fillSearchInputAndSubmit(searchTerm, page, testInfo.project.name);
      await waitForURLContainsQueryParamValue(page, "query", searchTerm);

      // Apply a status filter
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

      // Apply a sort order
      await selectSortBy(page, sortValue, isMobile, testInfo.project.name);
      await waitForURLContainsQueryParamValue(page, "sortby", sortValue);

      // Capture the result count for this criteria set, to confirm re-running
      // the saved search later shows matching results
      const expectedResultCount =
        await getNumberOfOpportunitySearchResults(page);

      // Navigate to page 2, to prove that pagination is NOT part of what gets
      // saved/restored (saving from page 2, reopening should land on page 1)
      const pageTwoButton = page.locator(
        'button[data-testid="pagination-page-number"][aria-label="Page 2"]',
      );
      const hasPageTwo = await pageTwoButton
        .first()
        .isVisible()
        .catch(() => false);
      if (hasPageTwo) {
        await clickPaginationPageNumber(page, 2);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          "save-search.spec: only one page of results for this criteria set; " +
            "skipping manual page-2 navigation before saving",
        );
      }

      // Open the "Save" modal and save with a unique name
      const openSaveModalButton = page.locator(
        '[data-testid="open-save-search-modal-button"]',
      );
      await openSaveModalButton.click();

      const savedSearchNameInput = page.locator("#saved-search-input");
      await savedSearchNameInput.waitFor({ state: "visible" });
      await savedSearchNameInput.fill(savedSearchName);

      const saveSearchButton = page.locator(
        '[data-testid="save-search-button"]',
      );
      await saveSearchButton.click();

      // Then a confirmation modal should appear with a link to the Workspace
      await expect(page.getByText("Query successfully saved")).toBeVisible({
        timeout: 30000,
      });
      const workspaceLink = page.getByRole("link", { name: "Workspace" });
      await expect(workspaceLink).toBeVisible();

      /**
       * @when I reopen the saved search
       */
      await workspaceLink.click();
      await page.waitForURL(/\/workspace\/saved-search-queries/, {
        timeout: GOTO_TIMEOUT,
      });

      // And I should see the saved search listed in the workspace
      const savedSearchListLink = page.getByRole("link", {
        name: savedSearchName,
      });
      await expect(savedSearchListLink).toBeVisible();

      // Reopen the saved search - the list item's name link is the "Run" affordance
      await savedSearchListLink.click();
      await page.waitForURL(/\/search\?/, { timeout: GOTO_TIMEOUT });
      await waitForSearchResultsInitialLoad(page);

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
      await expectSortBy(page, sortValue, isMobile);

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
});
