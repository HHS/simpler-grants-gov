/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/imnothere");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

// see https://github.com/vercel/next.js/issues/77512 - unskip once this issue is resolved
test.skip("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Oops! Page Not Found");
});

test("can view the home button", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Return Home" })).toHaveText(
    "Return Home",
  );
});
