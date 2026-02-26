import { expect, Page, test } from "@playwright/test";
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
  toggleCheckboxes,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";

const searchTerm = "education";
const statusCheckboxes = {
  "status-closed": "closed",
};
const fundingInstrumentCheckboxes = {
  "funding-instrument-other": "other",
  "funding-instrument-grant": "grant",
};

const eligibilityCheckboxes = {
  "eligibility-state_governments": "state_governments",
  "eligibility-county_governments": "county_governments",
};
const categoryCheckboxes = {
  "category-recovery_act": "recovery_act",
  "category-agriculture": "agriculture",
};

const ensureFilterDrawerOpen = async (page: Page, isMobile: boolean) => {
  if (!isMobile) {
    return;
  }
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

test.describe("Search page - state persistence after refresh", () => {
  test.skip(true, "legacy mega-test should be skipped in search.spec.ts");

  test("should retain search input and sort after refresh", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page);
    await ensureFilterDrawerOpen(page, isMobile);
    await selectSortBy(page, "awardCeilingDesc", isMobile);
    await expectSortBy(page, "awardCeilingDesc", isMobile);

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm);
    await waitForURLContainsQueryParamValue(page, "query", searchTerm);
    await waitForURLContainsQueryParamValue(page, "sortby", "awardCeilingDesc");
  });

  test("should retain core filters after refresh", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page, isMobile);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Opportunity status");
    await toggleCheckboxes(
      page,
      statusCheckboxes,
      "status",
      "forecasted,posted",
    );

    await ensureAccordionExpanded(page, "Funding instrument");
    await toggleCheckboxes(
      page,
      fundingInstrumentCheckboxes,
      "fundingInstrument",
    );

    await ensureAccordionExpanded(page, "Eligibility");
    await toggleCheckboxes(page, eligibilityCheckboxes, "eligibility");

    await ensureAccordionExpanded(page, "Category");
    await toggleCheckboxes(page, categoryCheckboxes, "category");

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page, isMobile);
    await ensureAccordionExpanded(page, "Opportunity status");
    await expectCheckboxesChecked(page, statusCheckboxes);

    await ensureAccordionExpanded(page, "Funding instrument");
    await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

    await ensureAccordionExpanded(page, "Eligibility");
    await expectCheckboxesChecked(page, eligibilityCheckboxes);

    await ensureAccordionExpanded(page, "Category");
    await expectCheckboxesChecked(page, categoryCheckboxes);

    await waitForURLContainsQueryParamValue(
      page,
      "status",
      "forecasted,posted,closed",
    );
    await waitForURLContainsQueryParamValue(
      page,
      "fundingInstrument",
      "other,grant",
    );
    await waitForURLContainsQueryParamValue(
      page,
      "eligibility",
      "state_governments,county_governments",
    );
    await waitForURLContainsQueryParamValue(
      page,
      "category",
      "recovery_act,agriculture",
    );
  });

  test("should retain agency filter after refresh", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);
    await ensureFilterDrawerOpen(page, isMobile);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Agency");
    const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    const agencyCheckboxes = { [agencyId]: agencyId };
    await toggleCheckboxes(page, agencyCheckboxes, "agency");

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page, isMobile);
    await ensureAccordionExpanded(page, "Agency");
    await expectCheckboxesChecked(page, agencyCheckboxes);
    await waitForURLContainsQueryParamValue(page, "agency", agencyId);
  });

  test("should retain all filters and inputs after refresh", async ({ page }, {
    project,
  }) => {
    const isMobile = !!project.name.match(/[Mm]obile/);
    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);
    await fillSearchInputAndSubmit(searchTerm, page);
    await ensureFilterDrawerOpen(page, isMobile);
    await selectSortBy(page, "awardCeilingDesc", isMobile);
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    await waitForFilterOptions(page, "agency");

    await ensureAccordionExpanded(page, "Opportunity status");
    await toggleCheckboxes(
      page,
      statusCheckboxes,
      "status",
      "forecasted,posted",
    );

    await ensureAccordionExpanded(page, "Funding instrument");
    await toggleCheckboxes(
      page,
      fundingInstrumentCheckboxes,
      "fundingInstrument",
    );

    await ensureAccordionExpanded(page, "Eligibility");
    await toggleCheckboxes(page, eligibilityCheckboxes, "eligibility");

    await ensureAccordionExpanded(page, "Agency");
    const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
    expect(agencyId).toBeTruthy();
    if (!agencyId) {
      test.fail();
      return;
    }
    const agencyCheckboxes = { [agencyId]: agencyId };
    await toggleCheckboxes(page, agencyCheckboxes, "agency");

    await ensureAccordionExpanded(page, "Category");
    await toggleCheckboxes(page, categoryCheckboxes, "category");

    await refreshPageWithCurrentURL(page);
    await waitForSearchResultsInitialLoad(page);

    await ensureFilterDrawerOpen(page, isMobile);
    await expectSortBy(page, "awardCeilingDesc", isMobile);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm);

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

    await waitForURLContainsQueryParamValue(page, "query", searchTerm);
    await waitForURLContainsQueryParamValue(page, "sortby", "awardCeilingDesc");
    await waitForURLContainsQueryParamValue(
      page,
      "status",
      "forecasted,posted,closed",
    );
    await waitForURLContainsQueryParamValue(
      page,
      "fundingInstrument",
      "other,grant",
    );
    await waitForURLContainsQueryParamValue(
      page,
      "eligibility",
      "state_governments,county_governments",
    );
    await waitForURLContainsQueryParamValue(page, "agency", agencyId);
    await waitForURLContainsQueryParamValue(
      page,
      "category",
      "recovery_act,agriculture",
    );
  });
});
