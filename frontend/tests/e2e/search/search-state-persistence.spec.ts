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
  // Sub-agencies are rendered in nested lists: ul.margin-left-4 > li
  // The result count is in a dedicated span.text-base-dark, e.g. "[5]"
  const subAgencyItems = page.locator(
    "#opportunity-filter-agency ul.margin-left-4 > li",
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

    // Step 1: Open filter drawer
    await ensureFilterDrawerOpen(page);

    // Step 2: Wait for agency filter options to load, which expands the accordion
    await waitForFilterOptions(page, "agency");

    // Step 3: Ensure Agency accordion is expanded (waitForFilterOptions clicks it,
    // but ensure it's open in case it was already open and got toggled closed)
    await ensureAccordionExpanded(page, "Agency");

    // Step 4: Wait for sub-agency nested lists to be visible
    await page.waitForSelector(
      "#opportunity-filter-agency ul.margin-left-4 > li",
      { state: "visible", timeout: 30000 },
    );

    // Step 5: Find first sub-agency with count > 0
    const subAgency = await getFirstSubAgencySelection(page);
    expect(subAgency).toBeTruthy();
    if (!subAgency) {
      test.fail();
      return;
    }

    const checkbox = page.locator(`input[id="${subAgency.id}"]`).first();

    await checkbox.waitFor({ state: "attached", timeout: 30000 });

    // Step 6: Click the sub-agency checkbox with robust cross-browser approach
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
        } catch {}
        // Strategy 2: Try clicking the label
        if (label) {
          try {
            (label as HTMLElement).click();
            if (el.checked) return true;
          } catch {}
        }
        // Strategy 3: Programmatically set checked and dispatch change event
        try {
          el.checked = true;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("input", { bubbles: true }));
          if (el.checked) return true;
        } catch {}
        return el.checked;
      }, subAgency.id);
      await page.waitForTimeout(500);

      if (!clickSucceeded || !(await checkbox.isChecked())) {
        if (attempt < 3) {
          continue;
        }
      }

      await expect(checkbox).toBeChecked({ timeout: 10000 });

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

    // Step 7: Refresh and verify persistence
    // Use direct navigation with domcontentloaded to avoid networkidle timeouts
    const currentURL = page.url();
    await page.goto(currentURL, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    // Give page time to render content after navigation
    await page.waitForTimeout(2000);

    try {
      await waitForSearchResultsInitialLoad(page, 120000);
    } catch (_e) {
      // Search results may not load if filter didn't persist, but we'll check anyway
    }

    await ensureFilterDrawerOpen(page);

    // Step 8: Re-expand Agency accordion and wait for sub-agencies to render
    await waitForFilterOptions(page, "agency");
    await ensureAccordionExpanded(page, "Agency");
    await page.waitForSelector(
      "#opportunity-filter-agency ul.margin-left-4 > li",
      { state: "visible", timeout: 30000 },
    );
    await page.waitForTimeout(1000);

    // Step 9: Verify sub-agency is still checked after refresh
    const checkedSubAgencyByValue = page
      .locator(
        `#opportunity-filter-agency input[type="checkbox"][value="${subAgency.value}"]`,
      )
      .first();
    await expect(checkedSubAgencyByValue).toBeChecked({ timeout: 15000 });

    expectURLQueryParamValues(page, "agency", [subAgency.value]);
  });
});
