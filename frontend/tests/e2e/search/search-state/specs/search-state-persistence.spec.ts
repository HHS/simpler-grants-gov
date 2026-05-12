/**
 * @featureArea Search
 * @feature Search State Persistence
 * @featureFiles
 *   - e2e/search/search-state/features/search-input-and-sort-persistence.feature
 *   - e2e/search/search-state/features/search-core-filters-persistence.feature
 *   - e2e/search/search-state/features/search-agency-filters-persistence.feature
 *   - e2e/search/search-state/features/search-multi-filters-persistence.feature
 * @description Validates persistence of search query, sorting, filters, and agency selections after page refresh via URL sync
 */

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
  toggleCheckbox,
  toggleCheckboxGroup,
  toggleFilterDrawer,
  waitForFilterOptions,
  waitForSearchResultsInitialLoad,
} from "tests/e2e/search/searchSpecUtil";
import { VALID_TAGS } from "tests/e2e/tags";

const { GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION, CORE_REGRESSION } =
  VALID_TAGS;

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

// Multi-value checkbox groups for comprehensive filter-persistence tests
const statusCheckboxesMulti = {
  "status-closed": "closed",
};

const fundingInstrumentCheckboxesMulti = {
  "funding-instrument-grant": "grant",
  "funding-instrument-other": "other",
};

const eligibilityCheckboxesMulti = {
  "eligibility-county_governments": "county_governments",
  "eligibility-state_governments": "state_governments",
};

const categoryCheckboxesMulti = {
  "category-agriculture": "agriculture",
  "category-recovery_act": "recovery_act",
};

const { baseUrl, targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv === "staging" ? 300000 : 60000;

const goToSearch = async (page: Page) => {
  if (targetEnv !== "local" && targetEnv !== "staging") {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(`${baseUrl}/search`, { timeout: GOTO_TIMEOUT });
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
  // Sub-agencies are rendered in nested lists: ul.margin-left-4 > li
  // Use test id for robust E2E selection: [data-testid="sub-agency-item"]
  // The result count is in a dedicated span.text-base-dark, e.g. "[5]"
  const subAgencyItems = page.locator(
    // "#opportunity-filter-agency ul.margin-left-4 > li",
    '[data-testid="sub-agency-item"]',
  );

  const count = await subAgencyItems.count();
  for (let i = 0; i < count; i += 1) {
    const item = subAgencyItems.nth(i);
    const checkbox = item.locator('input[type="checkbox"]').first();
    const countSpan = item.locator("span.text-base-dark").first();

    const id = await checkbox.getAttribute("id");
    const value = await checkbox.getAttribute("value");

    if (!id || !value) continue;
    if (await checkbox.isChecked()) continue;

    // Only pick sub-agencies that actually have results
    const countText = (await countSpan.textContent().catch(() => "")) ?? "";
    const countMatch = countText.match(/\[(\d+)\]/);
    if (!countMatch || Number(countMatch[1]) <= 0) continue;

    // Confirm the label is visible before we try to interact
    const label = item.locator(`label[for="${id}"]`).first();
    const isVisible = await label.isVisible().catch(() => false);
    if (!isVisible) continue;

    return { id, value };
  }

  return null;
};

test.describe("Search page - state persistence after refresh", () => {
  /**
   * @featureFile e2e/search/search-state/features/search-input-and-sort-persistence.feature
   * @scenario Retain search input and sort after refresh
   * Verifies that after entering a search term, selecting a sort order, and refreshing
   * the page, the search input value and sort selection are restored from the URL.
   */

  test(
    "should retain search input and sort after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }, { project }) => {
      test.setTimeout(240_000);
      const isMobile = !!project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I enter "<search-term>" in the search input and submit in "<viewport>"
      await fillSearchInputAndSubmit(searchTerm, page, project.name);

      // Then the browser URL contains "/search?query=<search-term>&sortby=<sort type>"
      await waitForURLContainsQueryParamValue(
        page,
        "query",
        searchTerm,
        120000,
      );

      // And I "<sort access action>"
      await toggleFilterDrawer(page);

      // And I select sort order "<sort label>"
      await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // Then the browser URL contains "/search?query=<search-term>&sortby=<sort type>"
      await waitForURLContainsQueryParamValue(
        page,
        "sortby",
        "awardCeilingDesc",
        120000,
      );

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // And the search input should contain "<search-term>"
      const searchInput = getSearchInput(page);
      await expect(searchInput).toHaveValue(searchTerm, {
        timeout: 60000,
      });

      // And the browser URL contains "/search?query=<search-term>&sortby=<sort type>"
      expectURLQueryParamValue(page, "query", searchTerm);
      expectURLQueryParamValue(page, "sortby", "awardCeilingDesc");
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-core-filters-persistence.feature
   * @scenario Retain status filter after refresh
   * Verifies that selecting the "Closed" status checkbox persists the status filter
   * (forecasted, posted, closed) in the URL after a page refresh.
   */
  test(
    "should retain status filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I open the filter drawer
      await ensureFilterDrawerOpen(page);

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // When I check the "<Opportunity status>" checkbox
      await toggleCheckboxGroup(page, statusCheckboxes);

      // Then the browser URL contains query param "status" with values "<expected statuses>"
      await waitForURLContainsQueryParamValues(
        page,
        "status",
        ["forecasted", "posted", "closed"],
        120000,
      );

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // And the "<Opportunity status>" checkbox should be checked
      await expectCheckboxesChecked(page, statusCheckboxes);

      // And the browser URL contains query param "status" with values "<expected statuses>"
      expectURLQueryParamValues(page, "status", [
        "forecasted",
        "posted",
        "closed",
      ]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-core-filters-persistence.feature
   * @scenario Retain funding instrument filter after refresh
   * Verifies that selecting a funding instrument checkbox (e.g. "Grant") persists
   * the fundingInstrument query param in the URL after a page refresh.
   */
  test(
    "should retain funding instrument filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Funding instrument" accordion is expanded
      await ensureAccordionExpanded(page, "Funding instrument");

      // When I check the "<funding instrument>" checkbox
      await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);

      // Then the browser URL contains query param "fundingInstrument" with values "<expected values>"
      await waitForURLContainsQueryParamValues(
        page,
        "fundingInstrument",
        ["grant"],
        120000,
      );

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Funding instrument" accordion is expanded
      await ensureAccordionExpanded(page, "Funding instrument");

      // And the "<funding instrument>" checkbox should be checked
      await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

      // And the browser URL contains query param "fundingInstrument" with values "<expected values>"
      expectURLQueryParamValues(page, "fundingInstrument", ["grant"]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-core-filters-persistence.feature
   * @scenario Retain eligibility filter after refresh
   * Verifies that selecting an eligibility checkbox (e.g. "County Governments") persists
   * the eligibility query param in the URL after a page refresh.
   */
  test(
    "should retain eligibility filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // When I open the filter drawer
      await ensureFilterDrawerOpen(page);

      // And the "Eligibility" accordion is expanded
      await ensureAccordionExpanded(page, "Eligibility");

      // When I check the "<eligibility>" checkbox
      await toggleCheckboxGroup(page, eligibilityCheckboxes);

      // Then the browser URL contains query param "eligibility" with values "<expected eligibility>"
      await waitForURLContainsQueryParamValues(
        page,
        "eligibility",
        ["county_governments"],
        120000,
      );

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Eligibility" accordion is expanded
      await ensureAccordionExpanded(page, "Eligibility");

      // And the "<eligibility>" checkbox should be checked
      await expectCheckboxesChecked(page, eligibilityCheckboxes);

      // And the browser URL contains query param "eligibility" with values "<expected eligibility>"
      expectURLQueryParamValues(page, "eligibility", ["county_governments"]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-core-filters-persistence.feature
   * @scenario Retain category filter after refresh
   * Verifies that selecting a category checkbox (e.g. "Agriculture") persists
   * the category query param in the URL after a page refresh.
   */
  test(
    "should retain category filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I open the filter drawer
      await ensureFilterDrawerOpen(page);

      // And the "Category" accordion is expanded
      await ensureAccordionExpanded(page, "Category");

      // When I check the "<category>" checkbox
      await toggleCheckboxGroup(page, categoryCheckboxes);

      // Then the browser URL contains query param "category" with values "<expected category>"
      await waitForURLContainsQueryParamValues(
        page,
        "category",
        ["agriculture"],
        120000,
      );

      // When I refresh the page
      await refreshPageWithCurrentURL(page);
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Category" accordion is expanded
      await ensureAccordionExpanded(page, "Category");

      // And the "<category>" checkbox should be checked
      await expectCheckboxesChecked(page, categoryCheckboxes);

      // And the browser URL contains query param "category" with values "<expected category>"
      expectURLQueryParamValues(page, "category", ["agriculture"]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-agency-filters-persistence.feature
   * @scenario Retain top-level agency filter after refresh
   * Verifies that checking a top-level agency "All" checkbox sets the topLevelAgency
   * query param and that the selection is restored after a page refresh.
   */
  test(
    "should retain agency filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      //When I open the filter drawer
      await ensureFilterDrawerOpen(page);

      // And agency filter options have loaded
      await waitForFilterOptions(page, "agency");

      // And the "Agency" accordion is expanded
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

      // When I check the first available top-level agency "All" checkbox
      await toggleCheckbox(page, allCheckboxId);

      // Then the URL should contain query param "topLevelAgency"
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

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page, 180000);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the "Agency" accordion is expanded
      await ensureAccordionExpanded(page, "Agency");
      await page.waitForTimeout(1000);

      // And the previously selected top-level agency checkbox should be checked
      const isChecked = await page
        .locator(`input[id="${allCheckboxId}"]`)
        .isChecked();
      expect(isChecked).toBe(true);

      // And the URL should contain query param "topLevelAgency" with the previously selected values
      expectURLQueryParamValues(page, "topLevelAgency", topLevelAgencyValues);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-agency-filters-persistence.feature
   * @scenario Retain sub-agency filter after refresh
   * Verifies that selecting a sub-agency checkbox (nested under an agency) sets the
   * agency query param and that the sub-agency selection is restored after a page refresh.
   */
  test(
    "should retain sub-agency filter after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }) => {
      test.setTimeout(240_000);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I open the filter drawer
      await ensureFilterDrawerOpen(page);

      // And agency filter options have loaded
      await waitForFilterOptions(page, "agency");

      // And the "Agency" accordion is expanded
      await ensureAccordionExpanded(page, "Agency");

      // And sub-agency options are visible
      await page.waitForSelector(
        "#opportunity-filter-agency ul.margin-left-4 > li",
        { state: "visible", timeout: 30000 },
      );

      // When I check the first available sub-agency checkbox with results
      const subAgency = await getFirstSubAgencySelection(page);
      expect(subAgency).toBeTruthy();
      if (!subAgency) {
        test.fail();
        return;
      }

      const checkbox = page.locator(`input[id="${subAgency.id}"]`).first();

      await checkbox.waitFor({ state: "attached", timeout: 30000 });

      // Click the sub-agency checkbox with robust cross-browser approach
      let selectedAndUpdated = false;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        // Ensure unchecked before clicking
        if (await checkbox.isChecked()) {
          await page.evaluate((id) => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            if (el) el.click();
          }, subAgency.id);
          await page.waitForTimeout(500);
          await expect(checkbox).not.toBeChecked({ timeout: 10000 });
        }

        // Scroll the checkbox into view and click with multiple strategies
        await page.evaluate((id) => {
          const el = document.getElementById(id) as HTMLInputElement | null;
          if (el) {
            // Scroll into view with center alignment
            el.scrollIntoView({
              block: "center",
              inline: "nearest",
              behavior: "instant",
            });
            // Also scroll parent drawer container if it exists
            const drawerContent =
              el.closest("[class*='drawer']") ||
              el.closest("[class*='modal']") ||
              el.closest("[role='region']");
            if (
              drawerContent &&
              drawerContent.scrollHeight > drawerContent.clientHeight
            ) {
              const rect = el.getBoundingClientRect();
              const containerRect = drawerContent.getBoundingClientRect();
              if (rect.top < containerRect.top) {
                drawerContent.scrollTop -= containerRect.top - rect.top + 100;
              } else if (rect.bottom > containerRect.bottom) {
                drawerContent.scrollTop +=
                  rect.bottom - containerRect.bottom + 100;
              }
            }
          }
        }, subAgency.id);
        await page.waitForTimeout(500);

        // Try multiple click strategies in order
        const clickSucceeded = await page.evaluate((id) => {
          const el = document.getElementById(id) as HTMLInputElement | null;
          if (!el) return false;
          const label = document.querySelector(`label[for="${id}"]`);
          // Strategy 1: Try clicking the checkbox directly
          try {
            el.click();
            if (el.checked) return true;
          } catch (_e) {
            console.warn("error clicking checkbox");
          }
          // Strategy 2: Try clicking the label
          if (label) {
            try {
              (label as HTMLElement).click();
              if (el.checked) return true;
            } catch (_e) {
              console.warn("error clicking checkbox label");
            }
          }
          // Strategy 3: Programmatically set checked and dispatch change event
          try {
            el.checked = true;
            el.dispatchEvent(new Event("change", { bubbles: true }));
            el.dispatchEvent(new Event("input", { bubbles: true }));
            if (el.checked) return true;
          } catch (_e) {
            console.warn("error manually dispatching checkbox click event");
          }
          return el.checked;
        }, subAgency.id);
        await page.waitForTimeout(500);

        if (!clickSucceeded || !(await checkbox.isChecked())) {
          if (attempt < 3) {
            continue;
          }
        }

        await expect(checkbox).toBeChecked({ timeout: 10000 });

        // Then the URL should contain query param "agency" with the selected sub-agency value
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
          if (attempt === 3) throw _e;
        }
      }

      expect(selectedAndUpdated).toBe(true);

      // Wait to ensure filter is fully applied before refresh
      await page.waitForTimeout(3000);

      // When I refresh the page
      // Use direct navigation with domcontentloaded to avoid networkidle timeouts
      const currentURL = page.url();
      await page.goto(currentURL, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      // Give page time to render content after navigation
      await page.waitForTimeout(2000);

      // Then the search results load
      try {
        await waitForSearchResultsInitialLoad(page, 120000);
      } catch (_e) {
        // Search results may not load if filter didn't persist, but we'll check anyway
      }

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And agency filter options have loaded
      await waitForFilterOptions(page, "agency");

      // And the "Agency" accordion is expanded
      await ensureAccordionExpanded(page, "Agency");

      // And sub-agency options are visible
      await page.waitForSelector(
        "#opportunity-filter-agency ul.margin-left-4 > li",
        { state: "visible", timeout: 30000 },
      );
      await page.waitForTimeout(1000);

      // And the previously selected sub-agency checkbox should be checked
      const checkedSubAgencyByValue = page
        .locator(
          `#opportunity-filter-agency input[type="checkbox"][value="${subAgency.value}"]`,
        )
        .first();
      await expect(checkedSubAgencyByValue).toBeChecked({ timeout: 15000 });

      // And the URL should contain query param "agency" with the selected sub-agency value
      expectURLQueryParamValues(page, "agency", [subAgency.value]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-multi-filters-persistence.feature
   * @scenario Retain all filters and inputs after refresh
   * Verifies that a combination of search input, sort order, status, funding instrument,
   * eligibility, agency, and category filters all persist in the URL after a page refresh.
   * Uses single-value selections per filter group.
   */
  test(
    "should retain all filters and inputs after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      test.setTimeout(240_000);
      const isMobile = !!project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I enter "<search-term>" in the search input and submit in "<viewport>"
      await fillSearchInputAndSubmit(searchTerm, page, project.name);

      // And the browser URL contains "query=<search-term>"
      await waitForURLContainsQueryParamValue(
        page,
        "query",
        searchTerm,
        120000,
      );

      // And I <sort access action>
      await ensureFilterDrawerOpen(page);

      // And I select sort order "<sort label>"
      await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // And the browser URL contains "sortby=<sort type>"
      await waitForURLContainsQueryParamValue(
        page,
        "sortby",
        "awardCeilingDesc",
        120000,
      );

      // And agency filter options have loaded
      await waitForFilterOptions(page, "agency");

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // And I check the "<status>" status checkbox
      await toggleCheckboxGroup(page, statusCheckboxes);

      // And the browser URL contains query param "status" with values "<status values>"
      await waitForURLContainsQueryParamValues(page, "status", [
        "forecasted",
        "posted",
        "closed",
      ]);

      // And the "Funding instrument" accordion is expanded
      await ensureAccordionExpanded(page, "Funding instrument");

      // And I check the "<funding instrument>" funding instrument checkbox
      await toggleCheckboxGroup(page, fundingInstrumentCheckboxes);

      // And the browser URL contains query param "fundingInstrument" with values "<funding value>"
      await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
        "grant",
      ]);

      // And the "Eligibility" accordion is expanded
      await ensureAccordionExpanded(page, "Eligibility");

      // And I check the "<eligibility>" eligibility checkbox
      await toggleCheckboxGroup(page, eligibilityCheckboxes);

      // And the browser URL contains query param "eligibility" with values "<eligibility value>"
      await waitForURLContainsQueryParamValues(page, "eligibility", [
        "county_governments",
      ]);

      // And the "Agency" accordion is expanded
      await ensureAccordionExpanded(page, "Agency");

      // And I check the first available non-numeric agency checkbox
      const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
      expect(agencyId).toBeTruthy();
      if (!agencyId) {
        test.fail();
        return;
      }
      const agencyCheckboxes = { [agencyId]: agencyId };
      await toggleCheckboxGroup(page, agencyCheckboxes);

      // And the browser URL contains query param "agency"
      await waitForURLContainsQueryParamValues(page, "agency", [agencyId]);

      // And the "Category" accordion is expanded
      await ensureAccordionExpanded(page, "Category");

      // And I check the "<category>" category checkbox
      await toggleCheckboxGroup(page, categoryCheckboxes);

      // And the browser URL contains query param "category" with values "<expected category>"
      await waitForURLContainsQueryParamValues(page, "category", [
        "agriculture",
      ]);

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // And the search input should contain "<search-term>"
      const searchInput = getSearchInput(page);
      await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // And the "<status>" status checkbox should be checked
      await expectCheckboxesChecked(page, statusCheckboxes);

      // And the "Funding instrument" accordion is expanded
      await ensureAccordionExpanded(page, "Funding instrument");

      // And the "<funding instrument>" funding instrument checkbox should be checked
      await expectCheckboxesChecked(page, fundingInstrumentCheckboxes);

      // And the "<eligibility>" eligibility checkbox should be checked
      await ensureAccordionExpanded(page, "Eligibility");
      await expectCheckboxesChecked(page, eligibilityCheckboxes);

      // And the previously selected agency checkbox should be checked
      await ensureAccordionExpanded(page, "Agency");
      await expectCheckboxesChecked(page, agencyCheckboxes);

      // And the "<category>" category checkbox should be checked
      await ensureAccordionExpanded(page, "Category");
      await expectCheckboxesChecked(page, categoryCheckboxes);

      // Then the URL should reflect the accumulated query parameters for the selected filters

      // And the browser URL contains "query=<search-term>"
      expectURLQueryParamValue(page, "query", searchTerm);
      // And the browser URL contains "sortby=<sort type>"
      expectURLQueryParamValue(page, "sortby", "awardCeilingDesc");
      // And the browser URL contains query param "status" with values "<status values>"
      expectURLQueryParamValues(page, "status", [
        "forecasted",
        "posted",
        "closed",
      ]);
      // And the browser URL contains query param "fundingInstrument" with values "<funding value>"
      expectURLQueryParamValues(page, "fundingInstrument", ["grant"]);
      // And the browser URL contains query param "eligibility" with values "<eligibility value>"
      expectURLQueryParamValues(page, "eligibility", ["county_governments"]);
      // And the browser URL contains query param "agency" with the selected sub-agency value
      expectURLQueryParamValues(page, "agency", [agencyId]);
      // And the browser URL contains query param "category" with values "<expected category>"
      expectURLQueryParamValues(page, "category", ["agriculture"]);
    },
  );

  /**
   * @featureFile e2e/search/search-state/features/search-multi-filters-persistence.feature
   * @scenario Retain all multi-value filters and inputs after refresh
   * Verifies that multiple values per filter group (e.g. two funding instruments, two
   * eligibility types, two categories) all persist correctly in the URL after a page refresh.
   * Filters are applied sequentially with result-load waits between each to prevent
   * race conditions where in-flight searches reset panel state from the URL.
   */
  test(
    "should retain all multi-value filters and inputs after refresh",
    { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
    async ({ page }, { project }) => {
      test.setTimeout(240_000);
      const isMobile = !!project.name.match(/[Mm]obile/);

      /**
       * @background
       * Given I am on the search page
       * And the search results have loaded
       */
      await goToSearch(page);
      await waitForSearchResultsInitialLoad(page);

      // When I enter "<search-term>" in the search input and submit in "<viewport>"
      await fillSearchInputAndSubmit(searchTerm, page, project.name);

      // Then the browser URL contains "query=<search-term>"
      await waitForURLContainsQueryParamValue(
        page,
        "query",
        searchTerm,
        120000,
      );

      // And I <sort access action>
      await ensureFilterDrawerOpen(page);

      // And I select sort order "<sort label>"
      await selectSortBy(page, "awardCeilingDesc", isMobile, project.name);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // And the browser URL contains "sortby=<sort value>"
      await waitForURLContainsQueryParamValue(
        page,
        "sortby",
        "awardCeilingDesc",
        120000,
      );

      // And agency filter options have loaded
      await waitForFilterOptions(page, "agency");

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // And I check the "<status>" status checkboxes
      await toggleCheckboxGroup(page, statusCheckboxesMulti);

      // And the browser URL contains query param "status" with values "<status values>"
      await waitForURLContainsQueryParamValues(page, "status", [
        "closed",
        "forecasted",
        "posted",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the "Funding instrument" accordion is expanded
      await ensureAccordionExpanded(page, "Funding instrument");

      // And I check the "<funding instrument 1>" funding instrument checkboxes
      await toggleCheckbox(page, "funding-instrument-grant");

      // And the browser URL contains query param "fundingInstrument" with values "<funding values>"
      await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
        "grant",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And I check the "<funding instrument 2>" funding instrument checkbox
      await toggleCheckbox(page, "funding-instrument-other");

      // And the browser URL contains query param "fundingInstrument" with values "<funding values>"
      await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
        "grant",
        "other",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the "Eligibility" accordion is expanded
      await ensureAccordionExpanded(page, "Eligibility");

      // And I check the "<eligibility>" eligibility checkbox
      await toggleCheckbox(page, "eligibility-county_governments");

      // And the browser URL contains query param "eligibility" with values "<eligibility value>"
      await waitForURLContainsQueryParamValues(page, "eligibility", [
        "county_governments",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And I check the "<eligibility 2>" eligibility checkbox
      await toggleCheckbox(page, "eligibility-state_governments");

      // And the browser URL contains query param "eligibility" with values "<eligibility values>"
      await waitForURLContainsQueryParamValues(page, "eligibility", [
        "county_governments",
        "state_governments",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the "Agency" accordion is expanded
      await ensureAccordionExpanded(page, "Agency");

      // And I check the first available non-numeric agency checkbox
      const agencyId = await getFirstNonNumericAgencyCheckboxId(page);
      expect(agencyId).toBeTruthy();
      if (!agencyId) {
        throw new Error("Could not find agency checkbox");
      }
      const agencyCheckboxes = { [agencyId]: agencyId };
      await toggleCheckboxGroup(page, agencyCheckboxes);

      // And the browser URL contains query param "agency" with the selected agency value
      await waitForURLContainsQueryParamValues(page, "agency", [agencyId]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the "Category" accordion is expanded
      await ensureAccordionExpanded(page, "Category");

      // And I check the "<category 1>" category checkbox
      await toggleCheckbox(page, "category-agriculture");

      // And the browser URL contains query param "category" with values "<category values>"
      await waitForURLContainsQueryParamValues(page, "category", [
        "agriculture",
      ]);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And I check the "<category 2>" category checkbox
      await toggleCheckbox(page, "category-recovery_act");

      // And the browser URL contains query param "category" with values "<category values>"
      await waitForURLContainsQueryParamValues(page, "category", [
        "agriculture",
        "recovery_act",
      ]);

      // When I refresh the page
      await refreshPageWithCurrentURL(page);

      // Then the search results load
      await waitForSearchResultsInitialLoad(page);

      // And the filter drawer is open
      await ensureFilterDrawerOpen(page);

      // And the sort order should be "<sort label>"
      await expectSortBy(page, "awardCeilingDesc", isMobile);

      // And the search input should contain "<search-term>"
      const searchInput = getSearchInput(page);
      await expect(searchInput).toHaveValue(searchTerm, { timeout: 60000 });

      // And the "Opportunity status" accordion is expanded
      await ensureAccordionExpanded(page, "Opportunity status");

      // And the "<status>" status checkboxes should be checked
      await expectCheckboxesChecked(page, statusCheckboxesMulti);

      // And the "<funding instrument 1>" funding instrument checkbox should be checked
      // And the "<funding instrument 2>" funding instrument checkbox should be checked
      await ensureAccordionExpanded(page, "Funding instrument");
      await expectCheckboxesChecked(page, fundingInstrumentCheckboxesMulti);

      // And the "<eligibility 1>" eligibility checkbox should be checked
      // And the "<eligibility 2>" eligibility checkbox should be checked
      await ensureAccordionExpanded(page, "Eligibility");
      await expectCheckboxesChecked(page, eligibilityCheckboxesMulti);

      // And the previously selected agency checkbox should be checked
      await ensureAccordionExpanded(page, "Agency");
      await expectCheckboxesChecked(page, agencyCheckboxes);

      // And the "<category 1>" category checkbox should be checked
      // And the "<category 2>" category checkbox should be checked
      await ensureAccordionExpanded(page, "Category");
      await expectCheckboxesChecked(page, categoryCheckboxesMulti);

      // Then the URL should reflect the accumulated query parameters for the selected filters

      // And the browser URL contains query param "status" with values "<status values>"
      expectURLQueryParamValues(page, "status", [
        "closed",
        "forecasted",
        "posted",
      ]);

      // And the browser URL contains query param "fundingInstrument" with values "<funding values>"
      expectURLQueryParamValues(page, "fundingInstrument", ["grant", "other"]);

      // And the browser URL contains query param "eligibility" with values "<eligibility values>"
      expectURLQueryParamValues(page, "eligibility", [
        "county_governments",
        "state_governments",
      ]);

      // And the browser URL contains query param "agency" with the selected agency value
      expectURLQueryParamValues(page, "agency", [agencyId]);

      // And the browser URL contains query param "category" with values "<category values>"
      expectURLQueryParamValues(page, "category", [
        "agriculture",
        "recovery_act",
      ]);
    },
  );
});
