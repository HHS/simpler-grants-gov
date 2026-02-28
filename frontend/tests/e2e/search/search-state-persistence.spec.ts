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
  getSearchInput,
  selectSortBy,
  toggleCheckbox,
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

const getFirstSubAgencySelection = async (page: Page) => {
  const subAgencyCheckboxes = page.locator(
    '#opportunity-filter-agency input[type="checkbox"]:not([id$="-any"]):not([id$="-all"])',
  );

  const count = await subAgencyCheckboxes.count();
  for (let i = 0; i < count; i += 1) {
    const checkbox = subAgencyCheckboxes.nth(i);
    const id = await checkbox.getAttribute("id");
    const value = await checkbox.getAttribute("value");

    if (!id || !value) {
      continue;
    }

    // A sub-agency code includes a top-level prefix, e.g. "USAID-ETH".
    if (!value.includes("-")) {
      continue;
    }

    const labelText =
      (await page.locator(`label[for="${id}"]`).first().textContent()) || "";

    // Prefer visible sub-agencies with non-zero count, e.g. "... [2]".
    const countMatch = labelText.match(/\[(\d+)\]\s*$/);
    if (!countMatch || Number(countMatch[1]) <= 0) {
      continue;
    }

    if (await checkbox.isChecked()) {
      continue;
    }

    return { id, value };
  }

  return null;
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

    // Wait for agency options to render
    await page.waitForTimeout(2000);

    // Find the first top-level agency "All" checkbox (more reliable than sub-agencies)
    // These checkboxes control the topLevelAgency query parameter
    const allAgencyCheckbox = page
      .locator('input[type="checkbox"][id$="-all"]')
      .first();

    const allCheckboxId = await allAgencyCheckbox.getAttribute("id");
    expect(allCheckboxId).toBeTruthy();
    if (!allCheckboxId) {
      test.fail();
      return;
    }

    // Click the top-level "All" checkbox
    await toggleCheckbox(page, allCheckboxId);

    // Wait for URL to contain the topLevelAgency parameter
    // The "All" checkbox sets topLevelAgency, not agency
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href);
        return url.searchParams.has("topLevelAgency");
      },
      { timeout: 120000 },
    );

    // Get the topLevelAgency value from URL to verify later
    const urlBeforeRefresh = new URL(page.url());
    const topLevelAgencyValues =
      urlBeforeRefresh.searchParams.get("topLevelAgency")?.split(",") || [];
    expect(topLevelAgencyValues.length).toBeGreaterThan(0);

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Agency");
    await page.waitForTimeout(1000);

    // Verify the "All" checkbox is still checked
    const isChecked = await page
      .locator(`input[id="${allCheckboxId}"]`)
      .isChecked();
    expect(isChecked).toBe(true);

    // Verify URL still contains the topLevelAgency parameter with same values
    expectURLQueryParamValues(page, "topLevelAgency", topLevelAgencyValues);
  });

  test("should retain sub-agency filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Agency");

    const visibleAgencyOptions = page.locator(
      "#opportunity-filter-agency label.usa-checkbox__label:visible",
    );
    await expect(visibleAgencyOptions.first()).toBeVisible({ timeout: 30000 });

    const subAgency = await getFirstSubAgencySelection(page);
    expect(subAgency).toBeTruthy();
    if (!subAgency) {
      test.fail();
      return;
    }

    const checkbox = page.locator(`input[id="${subAgency.id}"]`).first();
    const checkboxLabel = page
      .locator(`label[for="${subAgency.id}"]:visible`)
      .first();

    await checkbox.waitFor({ state: "attached", timeout: 30000 });
    await checkboxLabel.waitFor({ state: "visible", timeout: 30000 });
    await checkboxLabel.scrollIntoViewIfNeeded();

    // Retry once if click does not propagate to URL in time (seen in CI)
    let selectedAndUpdated = false;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      if (await checkbox.isChecked()) {
        await checkboxLabel.click();
        await expect(checkbox).not.toBeChecked({ timeout: 10000 });
      }

      await checkboxLabel.click();
      await expect(checkbox).toBeChecked({ timeout: 15000 });

      try {
        await waitForURLContainsQueryParamValues(
          page,
          "agency",
          [subAgency.value],
          60000,
        );
        selectedAndUpdated = true;
        break;
      } catch (_e) {
        if (attempt === 2) {
          throw _e;
        }
      }
    }

    expect(selectedAndUpdated).toBe(true);

    // Additional wait to ensure filter is fully applied before refresh
    await page.waitForTimeout(2000);

    // Refresh and wait for page to load
    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page, 180000);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Agency");
    await expect(visibleAgencyOptions.first()).toBeVisible({ timeout: 30000 });

    // Verify by stable identifier (value) instead of pre-refresh id
    const checkedSubAgencyByValue = page
      .locator(
        `#opportunity-filter-agency input[type="checkbox"][value="${subAgency.value}"]`,
      )
      .first();
    await expect(checkedSubAgencyByValue).toBeChecked({ timeout: 15000 });

    expectURLQueryParamValues(page, "agency", [subAgency.value]);
  });
});
