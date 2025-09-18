import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/imnothere");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Oops, we can't find that page.");
});

test("can view the home button", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Visit our homepage" }),
  ).toHaveText("Visit our homepage");
});
