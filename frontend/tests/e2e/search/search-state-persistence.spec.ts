import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue as expectURLQueryParamValueUnsafe,
  refreshPageWithCurrentURL,
  waitForURLContainsQueryParamValue,
} from "tests/e2e/playwrightUtils";
import {
  expectCheckboxIDIsChecked,
  expectSortBy,
  fillSearchInputAndSubmit,
  getSearchInput,
  selectSortBy,
  toggleFilterDrawer,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";

const searchTerm = "education";

const { baseUrl, targetEnv } = playwrightEnv;

const expectURLQueryParamValue = (
  page: Page,
  queryParamName: string,
  queryParamValue: string,
): void =>
  (
    expectURLQueryParamValueUnsafe as (
      page: Page,
      queryParamName: string,
      queryParamValue: string,
    ) => void
  )(page, queryParamName, queryParamValue);

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

const statusCheckboxes = {
  "status-forecasted": "forecasted",
  "status-open": "posted",
  "status-closed": "closed",
};

const fundingInstrumentCheckboxes = {
  "funding-instrument-grant": "grant",
};

const eligibilityCheckboxes = {
  "eligibility-county_governments": "county_governments",
};

const categoryCheckboxes = {
  "category-agriculture": "agriculture",
};

test.describe("Search page - state persistence after refresh", () => {
  test("should retain search input and sort after refresh", async ({ page }, {
    project,
  }) => {
    test.setTimeout(240_000);
    const isMobile = !!project.name.match(/[Mm]obile/);
    const isWebkit = !!project.name.match(/Webkit/i);
    const queryTimeout = isWebkit ? 180000 : 120000;
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page, project.name);
    await waitForURLContainsQueryParamValue(
      page,
      "query",
      searchTerm,
      queryTimeout,
    );
    await page.waitForTimeout(1500);
    await toggleFilterDrawer(page);
    await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    await waitForURLContainsQueryParamValue(
      page,
      "sortby",
      "awardCeilingDesc",
      queryTimeout,
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

    // Navigate with retry for Firefox which can have issues with multiple query params
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await page.goto(
          "/search?status=forecasted,posted,closed&fundingInstrument=grant&eligibility=county_governments&category=agriculture",
          { waitUntil: "domcontentloaded", timeout: 90000 },
        );
        break;
      } catch (error) {
        if (attempt < 2) {
          await page.waitForTimeout(1000);
          continue;
        }
        throw error;
      }
    }

    await waitForSearchResultsInitialLoad(page);
    await toggleFilterDrawer(page);

    for (const [checkboxID] of Object.entries(statusCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(fundingInstrumentCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(eligibilityCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(categoryCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await toggleFilterDrawer(page);

    for (const [checkboxID] of Object.entries(statusCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(fundingInstrumentCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(eligibilityCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }

    for (const [checkboxID] of Object.entries(categoryCheckboxes)) {
      await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
    }
  });
});
