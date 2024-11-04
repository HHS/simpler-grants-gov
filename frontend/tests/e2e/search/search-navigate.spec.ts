import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

import {
  clickMobileNavMenu,
  expectCheckboxIDIsChecked,
  expectURLContainsQueryParam,
  getMobileMenuButton,
  hasMobileMenu,
} from "./searchSpecUtil";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test("should navigate from index to search page", async ({
  page,
}: PageProps) => {
  await page.goto("/search");

  // Verify the presence of "Search" content on the page
  await expect(page.locator("h1")).toContainText(
    "Search funding opportunities",
  );

  // Verify that the 'forecasted' and 'posted' are checked
  await expectCheckboxIDIsChecked(page, "#status-forecasted");
  await expectCheckboxIDIsChecked(page, "#status-posted");
});
