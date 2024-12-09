/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/research");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Research | Simpler.Grants.gov");
});

test("can navigate to ethnio in new tab", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page
    .getByRole("link", { name: /Sign up to join a usability study/i })
    .getByTestId("button")
    .click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL(/ethn\.io/g);
});
