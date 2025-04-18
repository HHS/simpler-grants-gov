/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

// import { waitForURLChange } from "./playwrightUtils";

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

test("can navigate to grants.gov", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "View on Grants.gov" }).click();

  const newPage = await newTabPromise;
  // await waitForURLChange(page, (url) => !!url.match(/grants\.gov/));
  await expect(newPage).toHaveTitle("Search Results Detail | Grants.gov");
});
