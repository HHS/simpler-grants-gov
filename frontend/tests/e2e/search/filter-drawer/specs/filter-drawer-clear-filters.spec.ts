/**
 * @feature Filter Drawer - Clear Filters
 * @scenario Clicking Clear Filters updates results immediately
 * @scenario Clicking Clear Filters restores default filters
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  DEFAULT_STATUS_CHECKBOX_IDS,
  ELIGIBILITY_COUNTY,
  FUNDING_INSTRUMENT_GRANT,
  expectAdditionalFiltersCleared,
  LOGIN_STATES,
  openSearchWithFilterDrawer,
  selectAdditionalFilters,
} from "tests/e2e/utils/search/search-filter-utils";
import {
  clickClearFilters,
  expectCheckboxIDIsChecked,
  getNumberOfOpportunitySearchResults,
} from "tests/e2e/utils/search/searchSpecUtil";

const { targetEnv } = playwrightEnv;

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const POLL_TIMEOUT = targetEnv !== "local" ? 120000 : 60000;

for (const loginState of LOGIN_STATES) {
  test.describe(`Filter drawer - Clear Filters (${loginState})`, () => {
    test(
      "clicking Clear Filters updates results immediately",
      { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },

      async ({ page, context }, testInfo) => {
        test.setTimeout(180_000);

        // Given I have selected one or more filters
        await openSearchWithFilterDrawer(page, context, testInfo, loginState);

        const defaultCount = await getNumberOfOpportunitySearchResults(page);

        await selectAdditionalFilters(page);

        const filteredCount = await getNumberOfOpportunitySearchResults(page);

        expect(filteredCount).toBeLessThanOrEqual(defaultCount);

        // When I click the Clear Filters button
        await clickClearFilters(page);

        // Then the selected filters should be cleared from the drawer
        await expectAdditionalFiltersCleared(page);

        // And the search results should update to reflect no filters
        await expect
          .poll(() => getNumberOfOpportunitySearchResults(page), {
            timeout: POLL_TIMEOUT,
          })
          .toBe(defaultCount);
      },
    );

    // Scenario: Clicking Clear Filters restores default filters
    test(
      "clicking Clear Filters restores default filters",
      { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(180_000);

        // Given the default filters are "Posted" and "Forecasted"
        await openSearchWithFilterDrawer(page, context, testInfo, loginState);
        for (const id of DEFAULT_STATUS_CHECKBOX_IDS) {
          await expectCheckboxIDIsChecked(page, id);
        }

        // And I have selected additional filters
        await selectAdditionalFilters(page);

        // When I click the Clear Filters button
        await clickClearFilters(page);

        // Then only the default filters should remain selected
        for (const id of DEFAULT_STATUS_CHECKBOX_IDS) {
          await expectCheckboxIDIsChecked(page, id);
        }
        for (const id of [
          ...Object.keys(FUNDING_INSTRUMENT_GRANT),
          ...Object.keys(ELIGIBILITY_COUNTY),
        ]) {
          await expect(
            page.locator(`input[id="${id}"]`).first(),
          ).not.toBeChecked();
        }
      },
    );
  });
}
