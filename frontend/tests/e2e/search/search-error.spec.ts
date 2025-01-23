import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

import { toggleCheckbox, toggleMobileSearchFilters } from "./searchSpecUtil";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test.describe("Search error page", () => {
  test("should return an error page when expected", async ({
    page,
  }: PageProps) => {
    // trigger error by providing an invalid status value
    await page.goto("/search?status=not_a_status");

    expect(page.locator(".usa-alert--error")).toBeTruthy();
  });

  test("should allow for performing a new search from error state", async ({
    page,
  }, { project }) => {
    await page.goto("/search?status=not_a_status");

    if (project.name.match(/[Mm]obile/)) {
      await toggleMobileSearchFilters(page);
    }

    await toggleCheckbox(page, "status-closed");

    await page.waitForURL(/status\=forecasted\,posted\,closed/, {
      timeout: 5000,
    });
  });
});
