import { expect, test } from "@playwright/test";
import { baseURL } from "tests/playwright.config";

import { createSpoofedSessionCookie } from "./loginUtils";
import { openMobileNav, waitForURLChange } from "./playwrightUtils";

test.afterEach(async ({ context }) => {
  await context.close();
});

test("shows unauthenticated state if not logged in", async ({ page }) => {
  await page.goto("/saved-opportunities");
  const h4 = page.locator(".usa-alert__body .usa-alert__heading");
  await expect(h4).toHaveText("Not signed in");
});

test("shows save / search cta if logged in", async ({ page, context }, {
  project,
}) => {
  await createSpoofedSessionCookie(context);
  await page.goto(baseURL);

  if (project.name.match(/[Mm]obile/)) {
    await openMobileNav(page);
  }
  const dropDownButton = page.locator("#nav-dropdown-button-4");
  await dropDownButton.click();

  const savedOpportunitiesNavItem = page.locator(
    "ul#Workspace li:nth-child(2)",
  );
  await expect(savedOpportunitiesNavItem).toHaveText("Saved opportunities");
  await savedOpportunitiesNavItem.click();

  await waitForURLChange(page, (url) => !!url.match(/saved-opportunities/));
  await expect(page).toHaveTitle("Saved Opportunities | Simpler.Grants.gov");
});
