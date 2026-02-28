import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  expectURLQueryParamValue,
  expectURLQueryParamValues,
  refreshPageWithCurrentURL,
  waitForURLContainsQueryParamValue,
  waitForURLContainsQueryParamValues,
} from "tests/e2e/playwrightUtils";
import {
  ensureAccordionExpanded,
  ensureFilterDrawerOpen,
  expectCheckboxesChecked,
  expectSortBy,
  fillSearchInputAndSubmit,
  getFirstNonNumericAgencyCheckboxId,
  getSearchInput,
  selectSortBy,
  toggleCheckboxGroup,
  toggleFilterDrawer,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";

const searchTerm = "education";

const statusCheckboxes = {
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
    await waitForSearchResultsInitialLoad(page, 180000);

    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });
    expectURLQueryParamValue(page, "query", searchTerm);
    expectURLQueryParamValue(page, "sortby", "awardCeilingDesc");
  });

  test("should retain status filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);

    await ensureAccordionExpanded(page, "Opportunity status");
    await toggleCheckboxGroup(page, statusCheckboxes);
    await waitForURLContainsQueryParamValues(
      page,
      "status",
      ["forecasted", "posted", "closed"],
      120000,
    );

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Opportunity status");
    await expectCheckboxesChecked(page, statusCheckboxes);

    expectURLQueryParamValues(page, "status", [
      "forecasted",
      "posted",
      "closed",
    ]);
  });

  test("should retain funding instrument filter after refresh", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);

    await ensureAccordionExpanded(page, "Funding instrument");
    await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);
    await waitForURLContainsQueryParamValues(
      page,
      "fundingInstrument",
      ["grant"],
      120000,
    );

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Funding instrument");
    await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

    expectURLQueryParamValues(page, "fundingInstrument", ["grant"]);
  });

  test("should retain eligibility filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);

    await ensureAccordionExpanded(page, "Eligibility");
    await toggleCheckboxGroup(page, eligibilityCheckboxes);
    await waitForURLContainsQueryParamValues(
      page,
      "eligibility",
      ["county_governments"],
      120000,
    );

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Eligibility");
    await expectCheckboxesChecked(page, eligibilityCheckboxes);

    expectURLQueryParamValues(page, "eligibility", ["county_governments"]);
  });

  test("should retain category filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);

    await ensureAccordionExpanded(page, "Category");
    await toggleCheckboxGroup(page, categoryCheckboxes);
    await waitForURLContainsQueryParamValues(
      page,
      "category",
      ["agriculture"],
      120000,
    );

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Category");
    await expectCheckboxesChecked(page, categoryCheckboxes);

    expectURLQueryParamValues(page, "category", ["agriculture"]);
  });

  test("should retain agency filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Agency");
    // Wait for agency sub-options to render
    await page.waitForTimeout(2000);
    const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    const selectedAgencyValue =
      (await page
        .locator(`input[id="${agencyId}"]`)
        .first()
        .getAttribute("value")) || agencyId;

    const agencyCheckboxes = { [agencyId]: selectedAgencyValue };
    await toggleCheckboxGroup(page, agencyCheckboxes);
    await waitForURLContainsQueryParamValues(
      page,
      "agency",
      [selectedAgencyValue],
      120000,
    );

    // Add error handler before refresh to catch page crashes
    let pageError: string | null = null;
    page.once("crash", () => {
      pageError = "Page crashed";
    });

    await refreshPageWithCurrentURL(page);

    // Check if page crashed
    if (pageError) {
      throw new Error(pageError);
    }

    // Wait for page to stabilize - try to find any content indicator, not just Opportunities heading
    try {
      await page
        .waitForLoadState("networkidle", { timeout: 30000 })
        .catch(() => {});
      // Try to find either the results or an error message
      const pageContent = await page.content();
      if (pageContent.includes("error") || pageContent.includes("Error")) {
        // Page loaded but with error - still try to proceed
        await page.waitForTimeout(2000);
      }
    } catch (_e) {
      // Ignore timeout, page might still be responsive
    }

    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Agency");
    await page.waitForTimeout(1000);
    await expectCheckboxesChecked(page, agencyCheckboxes);
    expectURLQueryParamValues(page, "agency", [selectedAgencyValue]);
  });
});
