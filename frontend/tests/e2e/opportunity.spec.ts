/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/opportunity/1");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/^Opportunity Listing - */);
});

test("has page attributes", async ({ page }) => {
  await expect(page.getByText("Forecasted")).toBeVisible();
});
