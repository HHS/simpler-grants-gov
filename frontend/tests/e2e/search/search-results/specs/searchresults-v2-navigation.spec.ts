/**
 * @feature Opportunity Detail Navigation – Search Results Table
 * @featureFile e2e/search/search-results/features/searchresults-v2-navigation.feature
 *
 * Every scenario runs once per login state in the feature's Examples table. The "logged in"
 * variants run on desktop Chrome only: login adds little to how results link to detail pages,
 * so the other browsers and the mobile viewport cover "not logged in" only.
 *
 * @scenario Navigate to detail page from different clickable entry points
 * @scenario Navigate to detail page from various result states
 *    One test per state type: filters, sorting, pagination.
 * @scenario Opportunity Detail page loads successfully
 * @scenario Direct URL access using link copied from search results
 * @scenario Browser back returns user to Search Results page
 * @scenario Search state is preserved after returning from detail page
 * @scenario Rapid repeated clicks do not cause incorrect navigation
 */

import { expect, test, type TestInfo } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  gotoSearchPage,
  LOGIN_STATES,
} from "tests/e2e/utils/search/search-filter-utils";
import {
  applyKeywordFilterSortAndPage2,
  applyResultState,
  captureSearchState,
  clickResultTitle,
  expectOpportunityDetailLoaded,
  expectOpportunityDetailPage,
  expectOpportunityStatusTag,
  expectSearchStatePreserved,
  getNavigationSortCase,
  goBackToSearchResults,
  gotoOpportunityDetailByLink,
  rapidlyClickResultTitle,
  readResultSelection,
  RESULT_STATE_TYPES,
} from "tests/e2e/utils/search/search-navigation-utils";
import { getNumberOfOpportunitySearchResults } from "tests/e2e/utils/search/search-utils";

const { DISCOVERY, FULL_REGRESSION } = VALID_TAGS;

// KNOWN GAP: the Opportunity Detail route is rendered on the server and has no loading state (no
// loading.tsx or Suspense fallback), so there is no loading indicator to appear while data is
// fetched. The AC "a loading indicator should appear while data is being fetched" can't be
// asserted yet, so it is recorded as a "known-issue" annotation instead of failing the test.
// The "disappears once data loads" part is checked by expectOpportunityDetailLoaded.
// TODO: link the ticket here. Once the page has a loading indicator, replace this with an
// assertion that it appears and then disappears.
function recordMissingLoadingIndicator(testInfo: TestInfo): void {
  testInfo.annotations.push({
    type: "known-issue",
    description:
      "Opportunity Detail page has no loading indicator to appear while data is fetched " +
      "(no loading.tsx or Suspense fallback on the route)",
  });
}

test.describe("Opportunity detail navigation from search results", () => {
  for (const loginState of LOGIN_STATES) {
    test.describe(`(${loginState})`, () => {
      test.beforeEach(async ({ page, context, browserName }, testInfo) => {
        test.setTimeout(300_000);
        const isMobile = !!testInfo.project.name.match(/[Mm]obile/);
        test.skip(
          loginState === "logged in" &&
            (isMobile || browserName !== "chromium"),
          "Logged in variants run on desktop Chrome only",
        );
        /**
         * @background
         * Given I am on the Search Funding Opportunity page
         * And search results are displayed
         * And my login state is "<loginState>"
         */
        await gotoSearchPage(page, context, testInfo, loginState);
        expect(
          await getNumberOfOpportunitySearchResults(page),
          "Expected search results in the default catalog",
        ).toBeGreaterThan(0);
      });

      test(
        "navigate to detail page from the results table",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }) => {
          /**
           * @when I click the title for an opportunity in the results table
           */
          const selected = await clickResultTitle(page);

          /**
           * @then I should be taken to the Opportunity Detail page
           * @and the URL should contain the selected opportunity identifier
           * @and the opportunity title displayed should match the selected result
           */
          await expectOpportunityDetailPage(page, selected);
        },
      );

      for (const stateType of RESULT_STATE_TYPES) {
        test(
          `navigate to detail page from various result states - ${stateType}`,
          { tag: [DISCOVERY, FULL_REGRESSION] },
          async ({ page }, testInfo) => {
            const projectName = testInfo.project.name;
            const isMobile = !!projectName.match(/[Mm]obile/);

            /**
             * @given I have applied "<stateType>" on the search results page
             */
            await applyResultState(page, stateType, isMobile, projectName);

            /**
             * @when I click an opportunity title
             * @then I should be taken to the correct Opportunity Detail page
             * @and the URL should contain the selected opportunity identifier
             */
            const selected = await clickResultTitle(page);
            await expectOpportunityDetailPage(page, selected);
          },
        );
      }

      test(
        "opportunity detail page loads successfully",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }, testInfo) => {
          /**
           * @when I navigate to an Opportunity Detail page
           */
          const selected = await clickResultTitle(page);

          /**
           * @then the page should load without error
           * @and a loading indicator should appear while data is being fetched
           * @and the loading indicator should disappear once data loads
           * @and the opportunity title and identifier should be displayed
           * @and the opportunity status should be displayed
           */
          recordMissingLoadingIndicator(testInfo);
          await expectOpportunityDetailLoaded(page);
          await expectOpportunityDetailPage(page, selected);
          await expectOpportunityStatusTag(page);
        },
      );

      test(
        "direct URL access using link copied from search results",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }) => {
          /**
           * @given I copy the link address from an opportunity title in the search results table
           */
          const selected = await readResultSelection(page);

          /**
           * @when I navigate directly to that copied Opportunity Detail URL
           * @then the corresponding Opportunity Detail page should load
           * @and the opportunity title should match the selected search result
           */
          await gotoOpportunityDetailByLink(page, selected.href);
          await expectOpportunityDetailLoaded(page);
          await expectOpportunityDetailPage(page, selected);
        },
      );

      test(
        "browser back returns user to search results page",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }) => {
          /**
           * @given I navigate to an Opportunity Detail page
           */
          const selected = await clickResultTitle(page);
          await expectOpportunityDetailPage(page, selected);

          /**
           * @when I press the browser back button
           * @then I should return to the Search Results page
           */
          await goBackToSearchResults(page);
          await expect(page).toHaveURL(/\/search(\?|$)/);
          expect(
            await getNumberOfOpportunitySearchResults(page),
          ).toBeGreaterThan(0);
        },
      );

      test(
        "search state is preserved after returning from detail page",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }, testInfo) => {
          const projectName = testInfo.project.name;
          const isMobile = !!projectName.match(/[Mm]obile/);
          const sortCase = getNavigationSortCase();

          /**
           * @given I have applied search keywords, filters, sorting, and navigated to page 2
           */
          const term = await applyKeywordFilterSortAndPage2(
            page,
            sortCase,
            isMobile,
            projectName,
          );
          const before = await captureSearchState(page);
          expect(before).toMatchObject({
            query: term,
            status: "posted",
            sortby: sortCase.value,
            page: "2",
          });

          /**
           * @and I navigate to an Opportunity Detail page
           */
          const selected = await clickResultTitle(page);
          await expectOpportunityDetailPage(page, selected);

          /**
           * @when I press the browser back button
           * @then my search keywords should be preserved
           * @and my applied filters should remain selected
           * @and my sort order should be preserved
           * @and I should return to the same pagination page
           */
          await goBackToSearchResults(page);
          await expectSearchStatePreserved(page, before, sortCase, isMobile);
        },
      );

      test(
        "rapid repeated clicks do not cause incorrect navigation",
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page }) => {
          /**
           * @when I rapidly click an opportunity title multiple times
           * @then I should be taken to a single correct Opportunity Detail page
           * The clicks must add one history entry, so one back press returns to search.
           */
          const { selected, historyEntriesAdded } =
            await rapidlyClickResultTitle(page);
          expect(
            historyEntriesAdded,
            "Repeated clicks should add a single browser history entry",
          ).toBe(1);
          await expectOpportunityDetailLoaded(page);
          await expectOpportunityDetailPage(page, selected);
        },
      );
    });
  }
});
