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
      // trigger error by providing an invalid status value
      await page.goto("/search?status=not_a_status");

      expect(page.locator(".usa-alert--error")).toBeTruthy();
    },
  );

  test(
    "should allow for performing a new search from error state",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      await page.goto("/search?status=not_a_status");

      await toggleFilterDrawer(page);
      await toggleCheckbox(page, "status-closed");

      await page.waitForURL(/closed/, {
        timeout: SEARCH_TIMEOUT,
      });
    },
  );
});
