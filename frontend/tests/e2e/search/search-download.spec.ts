/**
 * @feature Search Results CSV Download
 * @featureFile search-download.feature
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
      // Unsupported browsers or viewports are excluded for this scenario
      // downloads work manually in safari, but can't get the test to work
      // export button not available in mobile
      if (project.name.match(/webkit/) || project.name.match(/[Mm]obile/)) {
        return;
      }

      // Given I am on the Search Funding Opportunity page
      const downloadPromise = page.waitForEvent("download");
      await page.goto("/search");

      // When I click the search results export button
      await page
        .locator('div[data-testid="search-download-button-container"] > button')
        .click();
      const download = await downloadPromise;

      // Then a CSV file should download
      // And the filename should match "grants-search-<timestamp>.csv"
      expect(download.suggestedFilename()).toMatch(/grants-search-\d+\.csv/);
    },
  );
});
