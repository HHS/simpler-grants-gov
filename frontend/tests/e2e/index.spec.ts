/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Simpler.Grants.gov/);
});

test("clicking 'follow on GitHub' link opens a new tab pointed at Github repository", async ({
  page,
  context,
}) => {
  const pagePromise = context.waitForEvent("page");
  // Click the Follow on GitHub link
  await page.getByRole("link", { name: "Follow on GitHub" }).click();
  const newPage = await pagePromise;
  await newPage.waitForLoadState();
  await expect(newPage).toHaveURL(
    /https:\/\/github.com\/HHS\/simpler-grants-gov/,
  );
});

test("skips to main content when navigating via keyboard", async ({
  page,
  browserName,
}) => {
  // Firefox does not tab through links automatically and requires updating preferences at the
  // system settings level; https://www.a11yproject.com/posts/macos-browser-keyboard-navigation/
  test.skip(
    browserName === "firefox" && !process.env.CI,
    "Firefox's built-in tabbing focuses only on buttons and inputs",
  );

  const header = page.getByTestId("header");
  const skipToMainContentLink = page.getByRole("link", {
    name: /skip to main content/i,
  });

  await expect(header).toBeInViewport({ ratio: 1 });
  const key = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(key);
  await expect(skipToMainContentLink).toBeFocused();
  await page.keyboard.press("Enter");

  // Veifies that skipping to main content means the page scrolls past the header
  await expect(header).not.toBeInViewport({ ratio: 1 });
});
