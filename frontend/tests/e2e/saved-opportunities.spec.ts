import { expect, test } from "@playwright/test";

import playwrightEnv from "./playwright-env";
import { waitForURLChange } from "./playwrightUtils";
import { authenticateE2eUser } from "./utils/authenticate-e2e-user-utils";

const { targetEnv } = playwrightEnv;

// Note: do NOT close context in afterEach — Playwright manages context lifecycle
// automatically per test. Explicitly closing it here causes session loss when
// multiple auth tests run sequentially in the same suite.

test("Saved opportunities page shows unauthenticated state if not logged in", async ({
  page,
}) => {
  await page.goto("/saved-opportunities");
  const h4 = page.locator(".usa-alert__body .usa-alert__heading");
  await expect(h4).toHaveText("Not signed in");
});

// Skip non-Chrome browsers in staging
test.beforeEach((_, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

// will fail when run against staging until after https://github.com/HHS/simpler-grants-gov/issues/7769

test("Working saved opportunities page link appears in nav when logged in", async ({
  page,
  context,
}, { project }) => {
  const isMobile = project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

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
  await expect(page).toHaveTitle("Saved Opportunities | Simpler.Grants.gov", {
    timeout,
  });
});
