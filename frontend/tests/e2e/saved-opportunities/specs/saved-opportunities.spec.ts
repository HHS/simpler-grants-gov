import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav, waitForURLChange } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { ensureOpportunityIsSaved } from "tests/e2e/utils/saved-opportunities/save-opportunity-utils";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

const SAVED_OPPORTUNITY = {
  title: "TEST-APPLY-ORG-IND-OT01",
  opportunityNumber: "TEST-APPLY-ORG-IND-ON01",
} as const;

// Field label prefixes that must appear on the card regardless of environment-specific values
const CARD_FIELD_LABELS = [
  "Closing:",
  "Posted:",
  "Agency:",
  "Opportunity Number:",
  "Award Maximum:",
  "Minimum:",
  "Shared with:",
  "Saved by you",
  "Sharing Options",
] as const;

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

  /**
   * @scenario Logged-in user can view a saved opportunity and navigate to its detail page.
   *           If the opportunity is not already saved, it is found via Search and saved first.
   */
  test(
    "Logged-in user can view saved opportunities and navigate to opportunity detail page",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page, context }, { project }) => {
      const isMobile = project.name.match(/[Mm]obile/);

      // Given the user is authenticated
      await authenticateE2eUser(page, context, !!isMobile);

      // And the user opens the navigation menu if on mobile
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

      // And the opportunity is present in the saved list (saves via Search if not already saved).
      // Guarantees the page is fully settled and the opportunity link is visible before assertions.
      await ensureOpportunityIsSaved(page, SAVED_OPPORTUNITY.title);

      // *** Common assertions ***

      // And the page should not display any error states
      await expect(page.locator("body")).not.toContainText("500");
      await expect(page.locator("body")).not.toContainText(
        "Something went wrong",
      );

      // And the saved opportunity card should be visible
      await expect(
        page.getByRole("article", { name: SAVED_OPPORTUNITY.title }),
      ).toBeVisible();

      // And the card should display the opportunity title and number
      const opportunityCard = page.getByLabel(SAVED_OPPORTUNITY.title);
      await expect(opportunityCard).toContainText(SAVED_OPPORTUNITY.title);
      await expect(opportunityCard).toContainText(
        SAVED_OPPORTUNITY.opportunityNumber,
      );

      // And all expected field labels should be present on the card (values are env-specific)
      for (const label of CARD_FIELD_LABELS) {
        await expect(opportunityCard).toContainText(label);
      }

      // When the user clicks the opportunity title link
      await page.getByRole("link", { name: SAVED_OPPORTUNITY.title }).click();

      // Then the URL should navigate to the opportunity detail page
      await waitForURLChange(
        page,
        (url) => !!url.match(/opportunity|opportunities/),
      );

      // And the detail page should not display any error states
      await expect(page.locator("body")).not.toContainText("500");
      await expect(page.locator("body")).not.toContainText(
        "Something went wrong",
      );

      // And the opportunity detail heading should be visible
      await expect(
        page.getByRole("heading", { name: SAVED_OPPORTUNITY.title }),
      ).toBeVisible();

      // And the opportunity intro section should display the opportunity title
      await expect(page.getByTestId("opportunity-intro-content")).toContainText(
        SAVED_OPPORTUNITY.title,
      );

      // And a "Description" section heading should be visible
      await expect(
        page.locator("h2").filter({ hasText: "Description" }),
      ).toBeVisible();

      // And the opportunity description content should be present
      await expect(page.getByTestId("opportunity-description")).toContainText(
        "Description",
      );
    },
  );
});
