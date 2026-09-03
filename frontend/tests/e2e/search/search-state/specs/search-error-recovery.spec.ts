/**
 * @feature Search Error Handling and Recovery
 * @featureFile tests/e2e/search/search-state/features/search-error-recovery.feature
 * @scenario Drop invalid filter values from the URL and keep the page usable
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  toggleCheckbox,
  toggleFilterDrawer,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/utils/search/searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const SEARCH_TIMEOUT = playwrightEnv.targetEnv !== "local" ? 15000 : 5000;

// a filter value that is not in the hardcoded option list has no label, so it renders a pill
// with an empty label - and an empty aria-label - if it makes it as far as the pill list
const UNLABELED_PILL = '[aria-label="Remove  pill"]';

test.describe("Search invalid filter values", () => {
  test(
    "should drop an invalid filter value from the URL rather than erroring",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to "/search?status=not_a_status"
      await page.goto("/search?status=not_a_status");

      // Then the invalid status should be removed from the URL
      await page.waitForURL((url) => !url.search.includes("not_a_status"), {
        timeout: SEARCH_TIMEOUT,
      });

      // And I should see search results rather than an error alert
      await waitForSearchResultsInitialLoad(page);
      await expect(page.locator(".usa-alert--error")).toHaveCount(0);

      // And no unlabeled filter pill should be left behind
      await expect(page.locator(UNLABELED_PILL)).toHaveCount(0);
    },
  );

  test(
    "should keep the valid values when only some are invalid",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to "/search?status=not_a_status,closed"
      await page.goto("/search?status=not_a_status,closed");

      // Then only the valid status should remain in the URL
      await page.waitForURL((url) => url.search.includes("status=closed"), {
        timeout: SEARCH_TIMEOUT,
      });
      expect(page.url()).not.toContain("not_a_status");

      await expect(page.locator(".usa-alert--error")).toHaveCount(0);
    },
  );

  test(
    "should not re-append an invalid value when a valid filter is applied",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to "/search?status=not_a_status"
      await page.goto("/search?status=not_a_status");
      await waitForSearchResultsInitialLoad(page);

      // When I open the filters
      await toggleFilterDrawer(page);

      // And I select the "Closed" opportunity status filter
      await toggleCheckbox(page, "status-closed");

      // Then the URL should include the closed status without the invalid value.
      // Note that the default statuses come along with it, since the invalid value was
      // dropped on load and the status filter fell back to its defaults.
      await page.waitForURL(/status=[^&]*closed/, { timeout: SEARCH_TIMEOUT });
      expect(page.url()).not.toContain("not_a_status");

      // And the page should still be usable
      await expect(page.locator(".usa-alert--error")).toHaveCount(0);
      await expect(page.locator(UNLABELED_PILL)).toHaveCount(0);
    },
  );
});
