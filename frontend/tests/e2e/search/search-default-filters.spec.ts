/**
 * @feature Search - Default Filters
 * @featureFile e2e/search/search-core/features/search-default-filters.feature
 * @scenario Load search page with forecasted and open filters checked by default
 */

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

import { expectCheckboxIDIsChecked } from "./searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, SMOKE } = VALID_TAGS;

// Scenario: Load search page with forecasted and open filters checked by default
test(
  "should load search page with forecasted and open filters checked by default",
  { tag: [GRANTEE, OPPORTUNITY_SEARCH, SMOKE] },
  async ({ page }) => {
    // Given I am on the "Search funding opportunity" page
    await page.goto("/search");

    // Then I see the "Search funding opportunities" heading
    await expect(page.locator("h1")).toContainText(
      "Search funding opportunities",
    );

    // And the 'forecasted' and 'Open' filters are checked by default
    await expectCheckboxIDIsChecked(page, "status-forecasted");
    await expectCheckboxIDIsChecked(page, "status-open");
  },
);
