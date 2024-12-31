/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

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
}, {
  project: {
    use: { isMobile, defaultBrowserType },
  },
}) => {
  const isMobileSafari = isMobile && defaultBrowserType === "webkit";
  const returnToTopLink = page.getByRole("link", { name: /return to top/i });

  // https://github.com/microsoft/playwright/issues/2179
  if (!isMobileSafari) {
    await returnToTopLink.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
  }

  await expect(
    page.getByRole("heading", {
      name: /This site is a work in progress, with new features and updates based on your feedback./i,
    }),
  ).toBeVisible();

  await returnToTopLink.click();

  await expect(returnToTopLink).not.toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Our open process" }),
  ).toBeInViewport();
});

test("can view the 'Search interface launch'", async ({ page }) => {
  await page.getByRole("link", { name: "Try the new simpler search" }).click();

  await expect(page).toHaveURL(/search/);
});

test("can view the 'get involved' link", async ({ page }) => {
  await page
    .getByRole("link", { name: "Get involved in our open-source community" })
    .click();

  await expect(page).toHaveTitle(/Process | Simpler.Grants.gov/);
});
