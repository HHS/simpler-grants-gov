import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  refreshPageWithCurrentURL,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import {
  expectSortBy,
  fillSearchInputAndSubmit,
  getSearchInput,
  selectSortBy,
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
      await page.goto(`${baseUrl}/search`, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("ERR_NETWORK_CHANGED") && attempt < 2) {
        await page.waitForTimeout(1000);
        continue;
      }
      throw error;
    }
  }
};

const ensureFilterDrawerOpen = async (page: Page) => {
  const modalOpen = await page
    .locator('.usa-modal-overlay[aria-controls="search-filter-drawer"]')
    .isVisible();
  if (!modalOpen) {
    await page.locator("button[data-testid='toggle-drawer']").click();
  }
};

const expectURLQueryParamValue = (
  page: Page,
  queryParamName: string,
  queryParamValue: string,
) => {
  const url = new URL(page.url());
  const params = new URLSearchParams(url.search);
  const actualValue = params.get(queryParamName);
  expect(actualValue).toBe(queryParamValue);
};

test.describe("Search page - state persistence after refresh", () => {
  test("should retain search input and sort after refresh", async ({ page }, {
    project,
  }) => {
    test.setTimeout(240_000);
    const isMobile = !!project.name.match(/[Mm]obile/);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page);
    await waitForURLContainsQueryParamValue(page, "query", searchTerm, 120000);
    await ensureFilterDrawerOpen(page);
    await selectSortBy(page, "awardCeilingDesc", isMobile);
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
});
