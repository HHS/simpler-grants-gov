/**
 * @feature Home Page
 * @featureFile frontend/tests/e2e/home.feature
 * @scenarios
 *   - Show the page title
 *   - Clicking "Follow on GitHub" opens the repository in a new tab
 *   - Skip-to-main-content link is reachable by keyboard and scrolls past the gov banner
 *   - Mobile nav is hidden by default and opens when the menu button is clicked
 *   - Mobile nav closes when a navigation link is clicked
 *   - Mobile nav closes when the user clicks the overlay
 *   - Mobile nav closes when the viewport is resized above the breakpoint
 *   - Mobile nav closes when the Escape key is pressed
 */

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

import playwrightEnv from "./playwright-env";
import { openMobileNav } from "./playwrightUtils";

const { STATIC, SMOKE, CORE_REGRESSION, FULL_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

// Background: the user navigates to the home page "/"
test.beforeEach(async ({ page }) => {
  const timeout = targetEnv === "staging" ? 180000 : 60000;
  await page.goto("/", { waitUntil: "domcontentloaded", timeout });
});

/**
 * @scenario Show the page title
 */
test("has title", { tag: [STATIC, SMOKE] }, async ({ page }) => {
  // Then the page title should match "Simpler.Grants.gov"
  await expect(page).toHaveTitle(/Simpler\.Grants\.gov/);
});

/**
 * @scenario Clicking "Follow on GitHub" opens the repository in a new tab
 */
test(
  "clicking 'follow on GitHub' link opens a new tab pointed at Github repository",
  { tag: [STATIC, FULL_REGRESSION] },
  async ({ page, context }) => {
    const pagePromise = context.waitForEvent("page");

    // When the user clicks the "Follow on GitHub" link
    await page.getByRole("link", { name: "Follow on GitHub" }).click();

    // Then a new tab should open
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    // And the new tab URL should be "https://github.com/HHS/simpler-grants-gov"
    await expect(newPage).toHaveURL(
      "https://github.com/HHS/simpler-grants-gov",
    );
  },
);

/**
 * @scenario Skip-to-main-content link is reachable by keyboard and scrolls past the gov banner
 */
test(
  "skips to main content when navigating via keyboard",
  { tag: [STATIC, FULL_REGRESSION] },
  async ({ page, browserName }) => {
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

    // Given the government banner is fully in the viewport
    await expect(banner).toBeInViewport({ ratio: 1 });

    // When the user presses the Tab key
    const key = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.keyboard.press(key);

    // Then the "Skip to main content" link should be focused
    await expect(skipToMainContentLink).toBeFocused();

    // When the user presses the Enter key
    await page.keyboard.press("Enter");

    // Verifies that skipping to main content means the page scrolls past the official gov site banner
    // Then the government banner should no longer be fully in the viewport
    await expect(banner).not.toBeInViewport({ ratio: 1 });
  },
);

/**
 * @scenario Mobile nav is hidden by default and opens when the menu button is clicked
 */
test(
  "displays mobile nav at mobile width",
  { tag: [STATIC, SMOKE] },
  async ({ page }, { project }) => {
    // Given the viewport is set to a mobile width
    if (project.name.match(/[Mm]obile/)) {
      // confirm that nav items are not visible by default with menu closed
      // Then the primary navigation should contain 5 items
      const primaryNavItems = page.locator(
        ".usa-accordion > .usa-nav__primary-item",
      );
      await expect(primaryNavItems).toHaveCount(5);

      // And all primary navigation items should not be visible
      const allNavItems = await page
        .locator(".usa-accordion > .usa-nav__primary-item")
        .all();
      await Promise.all(
        allNavItems.map((item) => {
          return expect(item).not.toBeVisible();
        }),
      );

      // When the user opens the mobile nav menu
      await openMobileNav(page);

      // Then the navigation element should have the class "is-visible"
      const nav = page.locator(".usa-nav");
      await expect(nav).toHaveClass(/is-visible/);

      // And all primary navigation items should be visible
      await Promise.all(
        allNavItems.map((item) => {
          return expect(item).toBeVisible();
        }),
      );
    }
  },
);

/**
 * @scenario Mobile nav closes when a navigation link is clicked
 * @scenario Mobile nav closes when the user clicks the overlay
 * @scenario Mobile nav closes when the viewport is resized above the breakpoint
 * @scenario Mobile nav closes when the Escape key is pressed
 */
test(
  "hides mobile nav at expected times",
  { tag: [STATIC, CORE_REGRESSION] },
  async ({ page }, { project }) => {
    // Given the viewport is set to a mobile width
    if (project.name.match(/[Mm]obile/)) {
      // And the mobile nav menu is open
      const menuOpener = await openMobileNav(page);

      // --- Scenario: Mobile nav closes when a navigation link is clicked ---

      // When the user clicks the first navigation link
      // mobile menu closes when a navigation link is clicked
      const firstNavItem = page
        .locator(".usa-accordion > .usa-nav__primary-item > a")
        .first();
      await expect(firstNavItem).toBeVisible();
      await firstNavItem.click();

      // Then the first navigation link should not be visible
      await expect(firstNavItem).not.toBeVisible();

      // --- Scenario: Mobile nav closes when the user clicks the overlay ---

      // mobile menu closes on blur (when the user clicks away from the menu without selecting an option)
      const overlay = page.locator(".usa-overlay");

      // Then the overlay should not be visible (before reopening the menu)
      await expect(overlay).not.toBeVisible();

      // And the mobile nav menu is open
      await menuOpener.click();

      // Then the overlay should be visible
      await expect(overlay).toBeVisible();
      await expect(firstNavItem).toBeVisible();

      // When the user clicks the overlay
      await overlay.click();

      // Then the overlay should not be visible
      await expect(overlay).not.toBeVisible();

      // And the first navigation link should not be visible
      await expect(firstNavItem).not.toBeVisible();

      // --- Scenario: Mobile nav closes when the viewport is resized above the breakpoint ---

      // And the mobile nav menu is open
      // mobile menu closes on window resize above the breakpoint where the menu collapses
      await menuOpener.click();
      await expect(overlay).toBeVisible();
      await expect(firstNavItem).toBeVisible();

      // When the viewport width is resized to 1025px
      await page.setViewportSize({ width: 1025, height: 400 });

      // Then the overlay should not be visible
      await expect(overlay).not.toBeVisible();
      // not checking the nav item - it is still there, but displaying as a desktop nav item at this width

      // When the viewport width is resized back to 1023px (menu was never explicitly closed)
      // note that since you never explicitly closed the mobile menu it will still be open if you resize back below desktop
      await page.setViewportSize({ width: 1023, height: 400 });

      // Then the overlay should be visible (menu re-appears because it was never closed)
      await expect(overlay).toBeVisible();

      // --- Scenario: Mobile nav closes when the Escape key is pressed ---

      // When the user presses the Escape key
      // menu closes if the user presses the escape key
      await page.keyboard.up("Escape");

      // Then the first navigation link should not be visible
      await expect(firstNavItem).not.toBeVisible();

      // And the overlay should not be visible
      await expect(overlay).not.toBeVisible();
    }
  },
);
