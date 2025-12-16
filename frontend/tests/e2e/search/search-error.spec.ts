import { expect, test } from "@playwright/test";

import { toggleCheckbox, toggleFilterDrawer } from "./searchSpecUtil";

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
      timeout: 5000,
      waitUntil: "domcontentloaded",
    });
  });
});
