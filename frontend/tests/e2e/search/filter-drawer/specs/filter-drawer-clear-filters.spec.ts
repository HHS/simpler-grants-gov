/**
 * @feature Filter Drawer - Clear Filters
 * @scenario Clicking Clear Filters restores default filters
 * @scenario Clicking Clear Filters updates results immediately
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParamValues } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import {
  clickClearFilters,
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectCheckboxIDIsChecked,
  getNumberOfOpportunitySearchResults,
  toggleCheckboxGroup,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;
const { baseUrl, targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;
const POLL_TIMEOUT = targetEnv !== "local" ? 120000 : 60000;

// Background Examples: loginState
const LOGIN_STATES = ["logged in", "not logged in"] as const;
type LoginState = (typeof LOGIN_STATES)[number];

// Default status filters (src/constants/search.ts STATUS_FILTER_DEFAULT_VALUES).
// "Posted" is the `posted` value of the checkbox labelled "Open" (id status-open).
const DEFAULT_STATUS_CHECKBOX_IDS = ["status-forecasted", "status-open"];

// Additional (non-default) filters used by both scenarios
const FUNDING_INSTRUMENT_GRANT = { "funding-instrument-grant": "grant" };
const ELIGIBILITY_COUNTY = {
  "eligibility-county_governments": "county_governments",
};

/**
 * @background
 * Given I am on the Search Funding Opportunity page
 * And my login state is "<loginState>"
 * And I open the filter drawer
 */
async function openSearchWithFilterDrawer(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  loginState: LoginState,
): Promise<void> {
  const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

  if (loginState === "logged in") {
    skipNonChromeOnStaging(testInfo);
    await authenticateE2eUser(page, context, isMobile);
  }

  await gotoWithRetry(page, `${baseUrl}/search`, { timeout: GOTO_TIMEOUT });
  await waitForSearchResultsInitialLoad(page);
  await ensureFilterDrawerOpen(page);
}

// Given I have selected one or more filters
async function selectAdditionalFilters(page: Page): Promise<void> {
  await ensureAccordionExpanded(page, "Funding instrument");
  await toggleCheckboxGroup(page, FUNDING_INSTRUMENT_GRANT);
  await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
    "grant",
  ]);

  await ensureAccordionExpanded(page, "Eligibility");
  await toggleCheckboxGroup(page, ELIGIBILITY_COUNTY);
  await waitForURLContainsQueryParamValues(page, "eligibility", [
    "county_governments",
  ]);

  await waitForSearchResultsInitialLoad(page);
}

for (const loginState of LOGIN_STATES) {
  test.describe(`Filter drawer - Clear Filters (${loginState})`, () => {
    // Scenario: Clicking Clear Filters updates results immediately
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

        // Then the search results should update to reflect no filters
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
