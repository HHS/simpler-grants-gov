import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

import { toggleCheckbox, toggleFilterDrawer } from "./searchSpecUtil";

const SEARCH_TIMEOUT = playwrightEnv.targetEnv === "staging" ? 15000 : 5000;

test.describe("Search error page", () => {
  test("should return an error page when expected", async ({ page }) => {
    // trigger error by providing an invalid status value
    await page.goto("/search?status=not_a_status");

    expect(page.locator(".usa-alert--error")).toBeTruthy();
  });

  test("should allow for performing a new search from error state", async ({
    page,
  }) => {
    await page.goto("/search?status=not_a_status");

    await toggleFilterDrawer(page);
    await toggleCheckbox(page, "status-closed");

    await page.waitForURL(/closed/, {
      timeout: SEARCH_TIMEOUT,
    });
  });
});
