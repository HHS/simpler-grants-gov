import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
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

const ensureAccordionExpanded = async (
  page: Page,
  accordionTitle: string,
) => {
  const button = page.locator(
    `button.usa-accordion__button:has-text("${accordionTitle}")`,
  );
  await button.waitFor({ state: "visible", timeout: 15000 });
  const expanded = await button.getAttribute("aria-expanded");
  if (expanded !== "true") {
    await button.click();
  }
};

const expectCheckboxesChecked = async (
  page: Page,
  checkboxObject: Record<string, string>,
) => {
  for (const [checkboxID] of Object.entries(checkboxObject)) {
    await expectCheckboxIDIsChecked(page, `#${checkboxID}`);
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

const expectURLQueryParamValues = (
  page: Page,
  queryParamName: string,
  expectedValues: string[],
) => {
  const url = new URL(page.url());
  const params = new URLSearchParams(url.search);
  const actualValue = params.get(queryParamName) ?? "";
  const actualValues = actualValue
    .split(",")
    .filter((value) => value.length > 0)
    .sort();
  const sortedExpected = [...expectedValues].sort();
  expect(actualValues).toEqual(sortedExpected);
};

const getFirstNonNumericAgencyCheckboxId = async (page: Page) => {
  const agencyInputs = page.locator(
    "div[data-testid='Agency-filter'] > ul > li ul input",
  );
  const count = await agencyInputs.count();
  for (let i = 0; i < count; i += 1) {
    const id = await agencyInputs.nth(i).getAttribute("id");
    if (id && Number.isNaN(Number.parseInt(id[0], 10))) {
      return id;
    }
  }
  return null;
};

const waitForURLContainsQueryParamValues = async (
  page: Page,
  queryParamName: string,
  expectedValues: string[],
  timeout = targetEnv === "staging" ? 120000 : 60000,
) => {
  const sortedExpected = [...expectedValues].sort();
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const url = new URL(page.url());
    const params = new URLSearchParams(url.search);
    const actualValue = params.get(queryParamName) ?? "";
    const actualValues = actualValue
      .split(",")
      .filter((value) => value.length > 0)
      .sort();

    if (
      actualValues.length === sortedExpected.length &&
      actualValues.every((value, index) => value === sortedExpected[index])
    ) {
      return;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(
    `Url did not change to contain ${queryParamName}:${sortedExpected.join(",")} as expected`,
  );
};

const toggleCheckboxGroup = async (
  page: Page,
  checkboxObject: Record<string, string>,
) => {
  for (const [checkboxID] of Object.entries(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
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

  test("should retain core filters after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Opportunity status");
    await toggleCheckboxGroup(page, statusCheckboxes);
    await waitForURLContainsQueryParamValues(page, "status", [
      "forecasted",
      "posted",
      "closed",
    ]);

    await ensureAccordionExpanded(page, "Funding instrument");
    await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);
    await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
      "grant",
    ]);

    await ensureAccordionExpanded(page, "Eligibility");
    await toggleCheckboxGroup(page, eligibilityCheckboxes);
    await waitForURLContainsQueryParamValues(page, "eligibility", [
      "county_governments",
    ]);

    await ensureAccordionExpanded(page, "Category");
    await toggleCheckboxGroup(page, categoryCheckboxes);
    await waitForURLContainsQueryParamValues(page, "category", [
      "agriculture",
    ]);

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Opportunity status");
    await expectCheckboxesChecked(page, statusCheckboxes);

    await ensureAccordionExpanded(page, "Funding instrument");
    await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

    await ensureAccordionExpanded(page, "Eligibility");
    await expectCheckboxesChecked(page, eligibilityCheckboxes);

    await ensureAccordionExpanded(page, "Category");
    await expectCheckboxesChecked(page, categoryCheckboxes);

    expectURLQueryParamValues(page, "status", [
      "forecasted",
      "posted",
      "closed",
    ]);
    expectURLQueryParamValues(page, "fundingInstrument", ["grant"]);
    expectURLQueryParamValues(page, "eligibility", ["county_governments"]);
    expectURLQueryParamValues(page, "category", ["agriculture"]);
  });

  test("should retain agency filter after refresh", async ({ page }) => {
    test.setTimeout(240_000);
    await goToSearch(page);

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Agency");
    const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    const agencyCheckboxes = { [agencyId]: agencyId };
    await toggleCheckboxGroup(page, agencyCheckboxes);
    await waitForURLContainsQueryParamValues(page, "agency", [agencyId]);

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page);
    await ensureAccordionExpanded(page, "Agency");
    await expectCheckboxesChecked(page, agencyCheckboxes);
    expectURLQueryParamValues(page, "agency", [agencyId]);
  });

  test("should retain all filters and inputs after refresh", async ({ page }, {
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
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Opportunity status");
    await toggleCheckboxGroup(page, statusCheckboxes);
    await waitForURLContainsQueryParamValues(page, "status", [
      "forecasted",
      "posted",
      "closed",
    ]);

    await ensureAccordionExpanded(page, "Funding instrument");
    await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);
    await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
      "grant",
    ]);

    await ensureAccordionExpanded(page, "Eligibility");
    await toggleCheckboxGroup(page, eligibilityCheckboxes);
    await waitForURLContainsQueryParamValues(page, "eligibility", [
      "county_governments",
    ]);

    await ensureAccordionExpanded(page, "Agency");
    const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    const agencyCheckboxes = { [agencyId]: agencyId };
    await toggleCheckboxGroup(page, agencyCheckboxes);
    await waitForURLContainsQueryParamValues(page, "agency", [agencyId]);

    await ensureAccordionExpanded(page, "Category");
    await toggleCheckboxGroup(page, categoryCheckboxes);
    await waitForURLContainsQueryParamValues(page, "category", [
      "agriculture",
    ]);

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page);
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });

    await ensureAccordionExpanded(page, "Opportunity status");
    await expectCheckboxesChecked(page, statusCheckboxes);

    await ensureAccordionExpanded(page, "Funding instrument");
    await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

    await ensureAccordionExpanded(page, "Eligibility");
    await expectCheckboxesChecked(page, eligibilityCheckboxes);

    await ensureAccordionExpanded(page, "Agency");
    await expectCheckboxesChecked(page, agencyCheckboxes);

    await ensureAccordionExpanded(page, "Category");
    await expectCheckboxesChecked(page, categoryCheckboxes);

    expectURLQueryParamValue(page, "query", searchTerm);
    expectURLQueryParamValue(page, "sortby", "awardCeilingDesc");
    expectURLQueryParamValues(page, "status", [
      "forecasted",
      "posted",
      "closed",
    ]);
    expectURLQueryParamValues(page, "fundingInstrument", ["grant"]);
    expectURLQueryParamValues(page, "eligibility", ["county_governments"]);
    expectURLQueryParamValues(page, "agency", [agencyId]);
    expectURLQueryParamValues(page, "category", [
      "agriculture",
    ]);
  });
});
