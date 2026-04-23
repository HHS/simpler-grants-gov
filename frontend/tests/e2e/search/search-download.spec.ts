/**
 * @feature Search - Export Search Results
 * @featureFile frontend/tests/e2e/search/features/search-core/search-download.feature
 * @scenario Export current search results to CSV from the search page
 */

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION } = VALID_TAGS;

test.describe("Search results export", () => {
  test(
    "should download a csv file when requested",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }, { project }) => {
      // Given unsupported browsers or viewports are excluded for this scenario
      // downloads work manually in safari, but can't get the test to work
      // export button not available in mobile
      if (project.name.match(/webkit/) || project.name.match(/[Mm]obile/)) {
        return;
      }

      // Given the user is on the search page
      const downloadPromise = page.waitForEvent("download");
      await page.goto("/search");

      // When the user requests a CSV export
      await page
        .locator('div[data-testid="search-download-button-container"] > button')
        .click();
      const download = await downloadPromise;

      // Then a CSV file with the expected naming format is downloaded
      expect(download.suggestedFilename()).toMatch(/grants-search-\d+\.csv/);
    },
  );
});
