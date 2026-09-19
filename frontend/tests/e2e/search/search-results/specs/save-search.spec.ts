/**
 * @feature Save Search Button - Search Results Table
 * @scenario Saved search restores query, filters, sort order, and resets pagination
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

const searchTerm = "education";
const sortValue = "awardCeilingDesc";
const statusFilter = { "status-closed": "closed" };
const savedSearchName = `E2E Save Search Restore ${Date.now()}`;

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
      await gotoWithRetry(page, `${baseUrl}/search`, {
        timeout: GOTO_TIMEOUT,
      });
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
      // saved/restored (saving from page 2, reopening should land on page 1).
      // No-ops with a warning if this criteria set doesn't have a second page.
      await clickPaginationPageIfPresent(page, 2, "save-search.spec");

      // Open the "Save" modal, save with a unique name, and get the
      // confirmation modal's "Workspace" link
      const workspaceLink = await saveCurrentSearch(page, savedSearchName);

      /**
       * @when I reopen the saved search
       */
      await navigateToSavedSearches(page, workspaceLink);

      // And I should see the saved search listed in the workspace
      // (AC: newly saved search is listed in workspace)
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
