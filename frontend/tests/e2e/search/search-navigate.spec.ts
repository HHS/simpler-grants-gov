import { Page, expect, test } from "@playwright/test";
import {
  clickMobileNavMenu,
  clickSearchNavLink,
  expectCheckboxIDIsChecked,
  expectURLContainsQueryParam,
  getMobileMenuButton,
  hasMobileMenu,
} from "./searchSpecUtil";

import { BrowserContextOptions } from "playwright-core";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test("should navigate from index to search page", async ({
  page,
}: PageProps) => {
  // Start from the index page with feature flag set
  await page.goto("/?_ff=showSearchV0:true");

  // Mobile chrome must first click the menu button
  if (await hasMobileMenu(page)) {
    const menuButton = getMobileMenuButton(page);
    await clickMobileNavMenu(menuButton);
  }

  await clickSearchNavLink(page);

  // Verify that the new URL is correct
  expectURLContainsQueryParam(page, "status", "forecasted,posted");

  // Verify the presence of "Search" content on the page
  await expect(page.locator("h1")).toContainText(
    "Search funding opportunities",
  );

  // Verify that the 'forecasted' and 'posted' are checked
  await expectCheckboxIDIsChecked(page, "#status-forecasted");
  await expectCheckboxIDIsChecked(page, "#status-posted");
});
