/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/process");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Process | Simpler.Grants.gov");
});

test("can view banner and return to top after scrolling to the bottom", async ({
  page,
}) => {
  const returnToTopLink = page.getByRole("link", { name: /return to top/i });

  await returnToTopLink.scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", {
      name: /Attention! Go to www.grants.gov to search and apply for grants./i,
    }),
  ).toBeVisible();

  await returnToTopLink.click();

  await expect(returnToTopLink).not.toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Our open process" }),
  ).toBeInViewport();
});

test("can view the API milestone on GitHub", async ({ page }) => {
  await page
    .getByRole("link", { name: "View the API milestone on GitHub" })
    .click();

  await expect(page).toHaveURL(
    /https:\/\/github.com\/HHS\/simpler-grants-gov\/issues\/70/,
  );
});

test("can view the search milestone on GitHub", async ({ page }) => {
  await page
    .getByRole("link", { name: "View the search milestone on GitHub" })
    .click();

  await expect(page).toHaveURL(
    /https:\/\/github.com\/HHS\/simpler-grants-gov\/issues\/89/,
  );
});
