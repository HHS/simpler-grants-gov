/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

import {
  openMobileNav,
  performSignIn,
  waitForURLChange,
} from "./playwrightUtils";

test.afterEach(async ({ context }) => {
  await context.close();
});

test("redirects if not logged in", async ({ page }) => {
  await page.goto("/saved-grants");
  await expect(page).toHaveTitle("Unauthenticated | Simpler.Grants.gov");
});

test("shows save / search cta if logged in", async ({ page }, { project }) => {
  await page.goto("http://localhost:3000/?_ff=authOn:true");
  await performSignIn(page, project);

  if (project.name.match(/[Mm]obile/)) {
    await openMobileNav(page);
  }
  const savedGrantsNavItem = page.locator(".usa-nav li:nth-child(3)");
  expect(savedGrantsNavItem).toHaveText("Saved grants");
  await savedGrantsNavItem.click();

  await waitForURLChange(page, (url) => !!url.match(/saved-grants/));
  await expect(page).toHaveTitle("Saved Grants | Simpler.Grants.gov");
});
