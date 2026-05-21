/**
 * @feature Saved Opportunities Page
 * @featureFile frontend/tests/e2e/saved-opportunities/features/saved-opportunities.feature
 * @scenario Unauthenticated user accessing Saved Opportunities via direct URL
 * @scenario Logged-in user can access Saved Opportunities from the navigation menu
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav, waitForURLChange } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

// Note: do NOT close context in afterEach — Playwright manages context lifecycle
// automatically per test. Explicitly closing it here causes session loss when
// multiple auth tests run sequentially in the same suite.
test.describe("Saved Opportunities", () => {
  // Skip non-Chrome browsers in staging
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  /**
   * @scenario Unauthenticated user accessing Saved Opportunities via direct URL
   */
  test(
    "Saved opportunities page shows unauthenticated state if not logged in",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      // When the user navigates directly to the "/saved-opportunities" URL
      await page.goto("/saved-opportunities");

      // Then the page should display an alert heading with text "Not signed in"
      const h4 = page.locator(".usa-alert__body .usa-alert__heading");
      await expect(h4).toHaveText("Not signed in");
    },
  );

  /**
   * @scenario Logged-in user can access Saved Opportunities from the navigation menu
   * @outline viewport: desktop | mobile
   */
  test(
    "Working saved opportunities page link appears in nav when logged in",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      // And the viewport is set to "<viewport>"
      const isMobile = project.name.match(/[Mm]obile/);

      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // And the user opens the navigation menu if on mobile
      // On mobile, the desktop nav is collapsed into a hamburger menu.
      // Open it first so the Workspace dropdown button becomes visible.
      if (isMobile) {
        await openMobileNav(page);
      }

      // When the user clicks the "Workspace" dropdown button
      // find the Workspace nav dropdown item and open it
      const dropDownButton = page.locator("#nav-dropdown-button-4");
      await expect(dropDownButton).toBeInViewport();
      await dropDownButton.click();

      // And the user clicks the "Saved opportunities" item in the Workspace dropdown
      // the fourth item in the dropdown should be the saved opportunities link
      const savedOpportunitiesNavItem = page.locator(
        "ul#Workspace li:nth-child(4)",
      );
      await expect(savedOpportunitiesNavItem).toHaveText("Saved opportunities");
      await savedOpportunitiesNavItem.click();

      // Then the URL should contain "/saved-opportunities"
      await waitForURLChange(page, (url) => !!url.match(/saved-opportunities/));

      // And the page title should be "Saved Opportunities | Simpler.Grants.gov"
      const timeout = targetEnv === "staging" ? 30000 : 5000;
      await expect(page).toHaveTitle(
        "Saved opportunities | Simpler.Grants.gov",
        {
          timeout,
        },
      );
    },
  );
});
