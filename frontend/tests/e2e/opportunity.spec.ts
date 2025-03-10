/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/opportunity/32");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/^Opportunity Listing - */);
});

test("has page attributes", async ({ page }) => {
  await expect(page.getByText("Application process")).toBeVisible();
});

test("can expand and collapse summary", async ({ page }) => {
  await expect(page.getByText("Show full summary")).toBeVisible();
  await expect(page.getByText(/.*From single present little building.*/)).not.toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();

  await page.getByRole("button", { name: /^Show full summary$/ }).click();

  // validate that summary has been expanded
  await expect(page.getByText("Show full summary")).not.toBeVisible();
  await expect(page.getByText(/.*From single present little building.*/)).toBeVisible();
  await expect(page.getByText("Hide full description")).toBeVisible();

  await page.getByRole("button", { name: /^Hide full description$/ }).click();

  // validate that summary has been collapsed
  await expect(page.getByText("Show full summary")).toBeVisible();
  await expect(page.getByText(/.*From single present little building.*/)).not.toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
});

test("can expand and collapse description", async ({ page }) => {
  await expect(page.getByText("Show full description")).toBeVisible();
  await expect(page.getByText(/.*Year section value bag none clear.*/)).not.toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();

  await page.getByRole("button", { name: /^Show full description$/ }).click();

  // validate that description has been expanded
  await expect(page.getByText("Show full description")).not.toBeVisible();
  await expect(page.getByText(/.*Year section value bag none clear.*/)).toBeVisible();
  await expect(page.getByText("Hide full description")).toBeVisible();

  await page.getByRole("button", { name: /^Hide full description$/ }).click();

  // validate that description has been collapsed
  await expect(page.getByText("Show full description")).toBeVisible();
  await expect(page.getByText(/.*Year section value bag none clear.*/)).not.toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
});