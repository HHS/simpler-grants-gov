import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  refreshPageWithCurrentURL,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import {
  expectCheckboxIDIsChecked,
  expectSortBy,
  fillSearchInputAndSubmit,
  getSearchInput,
  selectSortBy,
  toggleCheckbox,
  toggleFilterDrawer,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";

const searchTerm = "education";

const { baseUrl, targetEnv } = playwrightEnv;

const goToSearch = async (page: Page) => {
  if (targetEnv !== "local" && targetEnv !== "staging") {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(`${baseUrl}/search`, { timeout: 30000 });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // Chromium can intermittently throw ERR_NETWORK_CHANGED while the
      // dev server is starting or reloading; retry once to stabilize.
      if (message.includes("ERR_NETWORK_CHANGED") && attempt < 2) {
        await page.waitForTimeout(1000);
        continue;
      }
      throw error;
    }
  }
};

test.describe("Search page - state persistence after refresh", () => {
  test("should retain search input and sort after refresh", async ({ page }, {
    project,
  }) => {
    test.setTimeout(240_000);
    const isMobile = !!project.name.match(/[Mm]obile/);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page, project.name);
    await waitForURLContainsQueryParamValue(page, "query", searchTerm, 120000);

    await toggleFilterDrawer(page);

    await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    await waitForURLContainsQueryParamValue(
      page,
      "sortby",
      "awardCeilingDesc",
      120000,
    );

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });
    expectURLQueryParamValue(page, "query", searchTerm);
    expectURLQueryParamValue(page, "sortby", "awardCeilingDesc");
  });

  test("should retain core filters after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await toggleFilterDrawer(page);

    // Toggle status filter
    await toggleCheckbox(page, "status-closed");

    // Verify status filter is in URL
    await waitForURLContainsQueryParamValue(
      page,
      "status",
      "forecasted,posted,closed",
      120000,
    );

    // Refresh page
    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);
    await toggleFilterDrawer(page);

    // Verify filter is still checked
    await expectCheckboxIDIsChecked(page, "#status-closed");
    expectURLQueryParamValue(page, "status", "forecasted,posted,closed");
  });
});
