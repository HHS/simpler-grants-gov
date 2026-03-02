import { expect, Locator, test } from "@playwright/test";

import { createSpoofedSessionCookie } from "./loginUtils";
import playwrightEnv from "./playwright-env";
import { openMobileNav, waitForURLChange } from "./playwrightUtils";
import { performStagingLogin } from "./utils/perform-login-utils";

const { targetEnv } = playwrightEnv;

test.afterEach(async ({ context }) => {
  await context.close();
});

test("Saved opportunities page shows unauthenticated state if not logged in", async ({
  page,
}) => {
  await page.goto("/saved-opportunities");
  const h4 = page.locator(".usa-alert__body .usa-alert__heading");
  await expect(h4).toHaveText("Not signed in");
});

// will fail when run against staging until after https://github.com/HHS/simpler-grants-gov/issues/7769
test("Working saved opportunities page link appears in nav when logged in", async ({
  page,
  context,
}, { project }) => {
  const isMobile = project.name.match(/[Mm]obile/);

  // get a test user logged in
  if (playwrightEnv.targetEnv === "local") {
    await createSpoofedSessionCookie(context);
    await page.goto("/", { waitUntil: "domcontentloaded" });
  } else if (playwrightEnv.targetEnv === "staging") {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const signOutButton = (await performStagingLogin(
      page,
      !!isMobile,
    )) as Locator;
    await expect(signOutButton).toHaveCount(1, {
      timeout: 120000,
    });
  } else {
    throw new Error(
      `unsupported env ${playwrightEnv.targetEnv} - only able to run tests against local or staging`,
    );
  }

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
  await expect(page).toHaveTitle("Saved Opportunities | Simpler.Grants.gov", {
    timeout,
  });
});
