/**
 * @feature Search Error Handling and Recovery
 * @featureFile search-error.feature
 * @scenario Show an error state for invalid search params and recover by running a valid search
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

import { toggleCheckbox, toggleFilterDrawer } from "./searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const SEARCH_TIMEOUT = playwrightEnv.targetEnv === "staging" ? 15000 : 5000;

test.describe("Search error page", () => {
  test(
    "should return an error page when expected",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to "/search?status=not_a_status"
      await page.goto("/search?status=not_a_status");

      // Then I should see an error alert on the page
      expect(page.locator(".usa-alert--error")).toBeTruthy();
    },
  );

  test(
    "should allow for performing a new search from error state",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to "/search?status=not_a_status"
      await page.goto("/search?status=not_a_status");

      // When I open the filters
      await toggleFilterDrawer(page);

      // And I select the "Closed" opportunity status filter
      await toggleCheckbox(page, "status-closed");

      // Then the URL should include "status=closed"
      await page.waitForURL(/closed/, {
        timeout: SEARCH_TIMEOUT,
      });
    },
  );
});
