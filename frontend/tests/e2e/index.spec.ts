import { expect, test } from "@playwright/test";

import playwrightEnv from "./playwright-env";
import { openMobileNav } from "./playwrightUtils";

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
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
    browserName === "firefox" && !playwrightEnv.isCi,
    "Firefox's built-in tabbing focuses only on buttons and inputs",
  );

  const banner = page.getByTestId("govBanner");
  const skipToMainContentLink = page.getByRole("link", {
    name: /skip to main content/i,
  });

  await expect(banner).toBeInViewport({ ratio: 1 });
  const key = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(key);
  await expect(skipToMainContentLink).toBeFocused();
  await page.keyboard.press("Enter");

  // Verifies that skipping to main content means the page scrolls past the official gov site banner
  await expect(banner).not.toBeInViewport({ ratio: 1 });
});

test("displays mobile nav at mobile width", async ({ page }, { project }) => {
  if (project.name.match(/[Mm]obile/)) {
    // confirm that nav items are not visible by default with menu closed
    const primaryNavItems = page.locator(
      ".usa-accordion > .usa-nav__primary-item",
    );
    await expect(primaryNavItems).toHaveCount(4);
    const allNavItems = await page
      .locator(".usa-accordion > .usa-nav__primary-item")
      .all();
    await Promise.all(
      allNavItems.map((item) => {
        return expect(item).not.toBeVisible();
      }),
    );

    await openMobileNav(page);
    const nav = page.locator(".usa-nav");
    await expect(nav).toHaveClass(/is-visible/);

    await Promise.all(
      allNavItems.map((item) => {
        return expect(item).toBeVisible();
      }),
    );
  }
});

test("hides mobile nav at expected times", async ({ page }, { project }) => {
  if (project.name.match(/[Mm]obile/)) {
    const menuOpener = await openMobileNav(page);

    // mobile menu closes when a navigation link is clicked
    const firstNavItem = page
      .locator(".usa-accordion > .usa-nav__primary-item > a")
      .first();
    await expect(firstNavItem).toBeVisible();
    await firstNavItem.click();
    await expect(firstNavItem).not.toBeVisible();

    // mobile menu closes on blur (when the user clicks away from the menu without selecting an option)
    const overlay = page.locator(".usa-overlay");
    await expect(overlay).not.toBeVisible();
    await menuOpener.click();
    await expect(overlay).toBeVisible();
    await expect(firstNavItem).toBeVisible();
    await overlay.click();
    await expect(overlay).not.toBeVisible();
    await expect(firstNavItem).not.toBeVisible();

    // mobile menu closes on window resize above the breakpoint where the menu collapses
    await menuOpener.click();
    await expect(overlay).toBeVisible();
    await expect(firstNavItem).toBeVisible();
    await page.setViewportSize({ width: 1025, height: 400 });
    await expect(overlay).not.toBeVisible();
    // not checking the nav item - it is still there, but displaying as a desktop nav item at this width

    // note that since you never explicitly closed the mobile menu it will still be open if you resize back below desktop
    await page.setViewportSize({ width: 1023, height: 400 });
    await expect(overlay).toBeVisible();

    // menu closes if the user presses the escape key
    await page.keyboard.up("Escape");
    await expect(firstNavItem).not.toBeVisible();
    await expect(overlay).not.toBeVisible();
  }
});
