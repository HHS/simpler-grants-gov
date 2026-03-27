import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

test.describe("Search results export", () => {
  test(
    "should download a csv file when requested",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }, { project }) => {
      // downloads work manually in safari, but can't get the test to work
      // export button not available in mobile
      if (project.name.match(/webkit/) || project.name.match(/[Mm]obile/)) {
        return;
      }
      const downloadPromise = page.waitForEvent("download");
      await page.goto("/search");
      await page
        .locator('div[data-testid="search-download-button-container"] > button')
        .click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/grants-search-\d+\.csv/);
    },
  );
});
