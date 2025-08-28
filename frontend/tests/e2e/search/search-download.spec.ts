import { expect, test } from "@playwright/test";

test.describe("Search results export", () => {
  test("should download a csv file when requested", async ({ page }, {
    project,
  }) => {
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
  });
});
