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

  test(
    "Saved opportunities page shows unauthenticated state if not logged in",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      await page.goto("/saved-opportunities");
      const h4 = page.locator(".usa-alert__body .usa-alert__heading");
      await expect(h4).toHaveText("Not signed in");
    },
  );

  test(
    "Working saved opportunities page link appears in nav when logged in",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = project.name.match(/[Mm]obile/);

      await authenticateE2eUser(page, context, !!isMobile);

      // On mobile, the desktop nav is collapsed into a hamburger menu.
      // Open it first so the Workspace dropdown button becomes visible.
      if (isMobile) {
        await openMobileNav(page);
      }

      // find the Workspace nav dropdown item and open it
      const dropDownButton = page.locator("#nav-dropdown-button-4");
      await expect(dropDownButton).toBeInViewport();
      await dropDownButton.click();

      // the fourth item in the dropdown should be the saved opportunities link
      const savedOpportunitiesNavItem = page.locator(
        "ul#Workspace li:nth-child(4)",
      );
      await expect(savedOpportunitiesNavItem).toHaveText("Saved opportunities");
      await savedOpportunitiesNavItem.click();

      await waitForURLChange(page, (url) => !!url.match(/saved-opportunities/));
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
