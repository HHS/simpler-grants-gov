/**
 * @feature 404 page
 * @featureFile frontend/tests/e2e/404.feature
 * @scenario Show the 404 page title
 * @scenario Show the link back home
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { STATIC, FULL_REGRESSION, CORE_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

test.beforeEach(async ({ page }) => {
  const timeout = targetEnv === "staging" ? 180000 : 60000;
  // Background: Given I open "/imnothere"
  await page.goto("/imnothere", {
    waitUntil: "load",
    timeout,
  });
  // Wait for staging to stabilize
  if (targetEnv === "staging") {
    await page.waitForTimeout(3000);
    // Skip if staging is unhealthy
    const isUnhealthy = await page.evaluate(() =>
      ["502", "503", "504"].some((code) =>
        document.body.innerText.includes(code),
      ),
    );
    test.skip(isUnhealthy, "Staging server is unhealthy, skipping test");
  }
});

// Scenario: Show the 404 page title
test("has title", { tag: [STATIC, CORE_REGRESSION] }, async ({ page }) => {
  const timeout = targetEnv === "staging" ? 30000 : 5000;
  // Then the page title should be "Oops, we can't find that page."
  await expect(page).toHaveTitle("Oops, we can't find that page.", {
    timeout,
  });
});

// Scenario: Show the link back home
test(
  "can view the home button",
  { tag: [STATIC, FULL_REGRESSION] },
  async ({ page }) => {
    const timeout = targetEnv === "staging" ? 30000 : 5000;
    await expect(
      // Then I should see a link titled "Visit our homepage"
      page.getByRole("link", { name: "Visit our homepage" }),
    ).toHaveText("Visit our homepage", { timeout });
  },
);
