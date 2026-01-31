import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

const { targetEnv } = playwrightEnv;

test.beforeEach(async ({ page }) => {
  const timeout = targetEnv === "staging" ? 180000 : 60000;
  await page.goto("/imnothere", {
    waitUntil: "domcontentloaded",
    timeout,
  });
  // Wait for staging to stabilize
  if (targetEnv === "staging") {
    await page.waitForTimeout(3000);
  }
});

test("has title", async ({ page }) => {
  const timeout = targetEnv === "staging" ? 30000 : 5000;
  await expect(page).toHaveTitle("Oops, we can't find that page.", {
    timeout,
  });
});

test("can view the home button", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Visit our homepage" }),
  ).toHaveText("Visit our homepage");
});
