import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { camelCase } from "lodash";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  waitForURLContainsQueryParam,
  waitForURLContainsQueryParamValue,
  waitForURLContainsQueryParamValues,
} from "tests/e2e/playwrightUtils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { gotoWithRetry } from "tests/e2e/utils/common/lifecycle-utils";
import { waitForSearchResultsInitialLoad } from "tests/e2e/utils/search/search-utils";

const { baseUrl, targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;
const FILTER_OPTIONS_TIMEOUT = targetEnv !== "local" ? 30000 : 10000;
const CLEAR_FILTERS_TIMEOUT = targetEnv !== "local" ? 120000 : 60000;

// Query params removed by the drawer's Clear Filters button.
const FILTER_QUERY_PARAMS = [
  "status",
  "fundingInstrument",
  "eligibility",
  "agency",
  "category",
  "closeDate",
  "postedDate",
  "costSharing",
  "topLevelAgency",
  "assistanceListingNumber",
];

export const LOGIN_STATES = ["logged in", "not logged in"] as const;
export type LoginState = (typeof LOGIN_STATES)[number];

// Default status filters (src/constants/search.ts STATUS_FILTER_DEFAULT_VALUES).
// "Posted" is the `posted` value of the checkbox labelled "Open" (id status-open).
export const DEFAULT_STATUS_CHECKBOX_IDS = ["status-forecasted", "status-open"];

export const FUNDING_INSTRUMENT_GRANT = {
  "funding-instrument-grant": "grant",
};

export const FUNDING_INSTRUMENT_OTHER = {
  "funding-instrument-other": "other",
};

export const ELIGIBILITY_COUNTY = {
  "eligibility-county_governments": "county_governments",
};

// ---------------------------------------------------------------------------
// Scenario composition (login + navigate + drawer open/apply/assert)
// ---------------------------------------------------------------------------

export async function gotoSearchPage(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  loginState: LoginState,
): Promise<void> {
  const isMobile = !!testInfo.project.name.match(/[Mm]obile/);

  if (loginState === "logged in") {
    skipNonChromeOnStaging(testInfo);
    await authenticateE2eUser(page, context, isMobile);
  }

  await gotoWithRetry(page, `${baseUrl}/search`, {
    timeout: GOTO_TIMEOUT,
  });

  await waitForSearchResultsInitialLoad(page);
}

export async function openSearchWithFilterDrawer(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  loginState: LoginState,
): Promise<void> {
  await gotoSearchPage(page, context, testInfo, loginState);
  await ensureFilterDrawerOpen(page);
}

export async function selectAdditionalFilters(page: Page): Promise<void> {
  await ensureAccordionExpanded(page, "Funding instrument");
  await toggleCheckboxGroup(page, FUNDING_INSTRUMENT_GRANT);

  await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
    "grant",
  ]);

  await ensureAccordionExpanded(page, "Eligibility");
  await toggleCheckboxGroup(page, ELIGIBILITY_COUNTY);

  await waitForURLContainsQueryParamValues(page, "eligibility", [
    "county_governments",
  ]);

  await waitForSearchResultsInitialLoad(page);
}

export async function expectAdditionalFiltersCleared(
  page: Page,
): Promise<void> {
  await ensureAccordionExpanded(page, "Funding instrument");

  await expect(
    page.getByRole("checkbox", {
      name: /grant/i,
    }),
  ).not.toBeChecked();

  await ensureAccordionExpanded(page, "Eligibility");

  await expect(
    page.getByRole("checkbox", {
      name: /county governments/i,
    }),
  ).not.toBeChecked();
}

// ---------------------------------------------------------------------------
// Filter drawer primitives (moved from searchSpecUtil.ts)
// ---------------------------------------------------------------------------

export async function toggleFilterDrawer(page: Page) {
  const modalOpen = await page
    .locator('.usa-modal-overlay[aria-controls="search-filter-drawer"]')
    .isVisible();
  const drawerToggleButtonSelector = modalOpen
    ? "button[data-testid='close-drawer']"
    : "button[data-testid='toggle-drawer']";
  const filterDrawerButton = page.locator(drawerToggleButtonSelector);
  await filterDrawerButton.click();
}

export async function ensureFilterDrawerOpen(page: Page) {
  const visibleStatusAccordion = page
    .locator('button[aria-controls="opportunity-filter-status"]:visible')
    .first();

  if (await visibleStatusAccordion.isVisible().catch(() => false)) {
    await page.waitForTimeout(200);
    return;
  }

  // Try the existing toggle helper first (handles open/close selector logic)
  await toggleFilterDrawer(page);
  await visibleStatusAccordion
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => undefined);

  // If still not visible, force open from top of page using drawer open button
  if (!(await visibleStatusAccordion.isVisible().catch(() => false))) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const drawerOpenButton = page
      .locator("button[data-testid='toggle-drawer']")
      .first();
    if (await drawerOpenButton.isVisible().catch(() => false)) {
      await drawerOpenButton.click();
      await visibleStatusAccordion
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => undefined);
    }
  }
}

// Targets the modal overlay, not the #search-filter-drawer wrapper: the wrapper
// has no in-flow content (its overlay is position: fixed), so its own box is
// empty and Playwright's visibility check on it is unreliable. The overlay is
// full-viewport and inherits the wrapper's is-visible / is-hidden visibility.
export const getFilterDrawer = (page: Page): Locator =>
  page.locator('.usa-modal-overlay[aria-controls="search-filter-drawer"]');

export const getFilterDrawerToggle = (page: Page): Locator =>
  page.locator("button[data-testid='toggle-drawer']");

// The drawer is rendered to a portal only after hydration (Drawer.tsx,
// renderToPortal={!isSSR}), so toBeHidden() alone passes vacuously on a page
// that has not hydrated yet. Require the overlay to be mounted and hidden.
export async function expectFilterDrawerClosed(page: Page): Promise<void> {
  await expect(getFilterDrawerToggle(page)).toBeEnabled();
  await expect(getFilterDrawer(page)).toHaveCount(1);
  await expect(getFilterDrawer(page)).toBeHidden();
}

export async function openFilterDrawer(page: Page): Promise<void> {
  await getFilterDrawerToggle(page).click();
  await expect(getFilterDrawer(page)).toBeVisible();
}

// Keyboard open keeps focus on the Filters button (a mouse click does not on
// every browser, e.g. WebKit), which the focus-return assertions rely on.
export async function openFilterDrawerWithKeyboard(
  page: Page,
  key: "Enter" | "Space" = "Enter",
): Promise<void> {
  await getFilterDrawerToggle(page).focus();
  await page.keyboard.press(key);
  await expect(getFilterDrawer(page)).toBeVisible();
}

export async function closeFilterDrawerWithCloseButton(
  page: Page,
): Promise<void> {
  await getFilterDrawer(page).locator("button.usa-modal__close").click();
  await expectFilterDrawerClosed(page);
}

export async function closeFilterDrawerWithViewResults(
  page: Page,
): Promise<void> {
  await getFilterDrawer(page)
    .locator("button[data-testid='close-drawer']")
    .click();
  await expectFilterDrawerClosed(page);
}

// Clicks the page overlay beside the drawer panel (not on the panel itself)
export async function clickOutsideFilterDrawer(page: Page): Promise<void> {
  const panel = await getFilterDrawer(page).locator(".usa-modal").boundingBox();
  const viewport = page.viewportSize();
  if (!panel || !viewport) {
    throw new Error("Unable to measure filter drawer panel or viewport");
  }

  const margin = 20;
  const y = viewport.height / 2;
  if (panel.x > margin) {
    await page.mouse.click(panel.x / 2, y);
  } else if (panel.x + panel.width < viewport.width - margin) {
    await page.mouse.click((panel.x + panel.width + viewport.width) / 2, y);
  } else {
    throw new Error(
      "Filter drawer fills the viewport; no area outside it to click",
    );
  }
}

// Focus is on the drawer panel itself or on an element inside it
export async function expectFocusInsideFilterDrawer(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = document.activeElement;
        return !!active?.closest("#search-filter-drawer .usa-modal");
      }),
    )
    .toBe(true);
}

export async function expectFocusReturnedToFilterDrawerToggle(
  page: Page,
): Promise<void> {
  await expect(getFilterDrawerToggle(page)).toBeFocused();
}

// Drawer panel and its critical controls are fully on screen
export async function expectFilterDrawerFitsViewport(
  page: Page,
): Promise<void> {
  const drawer = getFilterDrawer(page);
  await expect(drawer.locator(".usa-modal")).toBeInViewport({ ratio: 0.99 });
  await expect(drawer.locator(".usa-modal__heading")).toBeInViewport();
  await expect(drawer.locator("button.usa-modal__close")).toBeInViewport();
  await expect(
    drawer.locator("button[data-testid='close-drawer']"),
  ).toBeInViewport();
}

export async function expectCheckboxIDIsChecked(
  page: Page,
  checkboxId: string,
) {
  const checkbox: Locator = page.locator(`input[id="${checkboxId}"]`).first();
  await expect(checkbox).toBeChecked();
}

export async function toggleCheckboxes(
  page: Page,
  checkboxObject: Record<string, string>,
  queryParamName: string,
  startingQueryParams?: string,
) {
  let runningQueryParams = startingQueryParams ?? "";
  for (const [checkboxID, queryParamValue] of Object.entries(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
    runningQueryParams += runningQueryParams
      ? `,${queryParamValue}`
      : queryParamValue;
    await waitForURLContainsQueryParamValue(
      page,
      queryParamName,
      runningQueryParams,
    );
  }
}

export async function toggleCheckbox(page: Page, idWithoutHash: string) {
  const checkBox = page.locator(`input[id="${idWithoutHash}"]`).first();
  const checkBoxLabel = page
    .locator(`label[for="${idWithoutHash}"]:visible`)
    .first();
  const timeout = targetEnv !== "local" ? 120000 : 30000;
  await checkBox.waitFor({ state: "attached", timeout });
  await checkBoxLabel.waitFor({ state: "visible", timeout });
  await checkBoxLabel.scrollIntoViewIfNeeded();
  await expect(checkBox).toBeEnabled();

  if (await checkBox.isChecked()) return;

  await checkBoxLabel.click({ force: true });
  try {
    // The input is driven by URL/router state, so on a busy runner it can take
    // longer than a second to reflect the click. Give it room before assuming
    // the click was dropped.
    await expect(checkBox).toBeChecked({ timeout: 5000 });
  } catch {
    // Some browsers (notably WebKit) can silently drop a click. Retry only if the
    // box is still unchecked right now. Re-clicking a box that is merely slow to
    // update would toggle it back off.
    if (!(await checkBox.isChecked())) {
      await checkBox.dispatchEvent("click");
    }
    await expect(checkBox).toBeChecked({ timeout: 5000 });
  }
}

export async function toggleCheckboxGroup(
  page: Page,
  checkboxObject: Record<string, string>,
) {
  for (const checkboxID of Object.keys(checkboxObject)) {
    await toggleCheckbox(page, checkboxID);
  }
  // Callers (e.g. selectAdditionalFilters) wait on the resulting URL query
  // param immediately after calling this, which already covers propagation
  // and debounce — no additional fixed sleep needed here.
}

export async function expectCheckboxesChecked(
  page: Page,
  checkboxObject: Record<string, string>,
) {
  for (const checkboxID of Object.keys(checkboxObject)) {
    await expectCheckboxIDIsChecked(page, checkboxID);
  }
}

export async function getFirstNonNumericAgencyCheckboxId(page: Page) {
  const agencyCheckboxes = page.locator(
    '#opportunity-filter-agency input[type="checkbox"]',
  );

  const count = await agencyCheckboxes.count();
  for (let i = 0; i < count; i += 1) {
    const checkbox = agencyCheckboxes.nth(i);
    const id = await checkbox.getAttribute("id");
    const value = await checkbox.getAttribute("value");
    if (!id) {
      continue;
    }

    if (id.endsWith("-any") || value === "all") {
      continue;
    }

    if (!/^\d+$/.test(id) && !(await checkbox.isChecked())) {
      return id;
    }
  }

  return null;
}

export async function clickAccordionWithTitle(
  page: Page,
  accordionTitle: string,
) {
  const button = page.locator(
    `button.usa-accordion__button:has-text("${accordionTitle}")`,
  );
  await button.waitFor({ state: "visible", timeout: 15000 });
  await button.click();
}

export async function clickClearFilters(page: Page): Promise<void> {
  const clearButton = page
    .locator('button:has-text("Clear filters"):visible')
    .first();
  await expect(clearButton).toBeVisible();
  await clearButton.click();

  // Clear removes every filter param from the URL (status included, which
  // falls back to the forecasted + posted defaults)
  await page.waitForURL(
    (url) => FILTER_QUERY_PARAMS.every((key) => !url.searchParams.has(key)),
    { timeout: CLEAR_FILTERS_TIMEOUT },
  );
}

export async function ensureAccordionExpanded(
  page: Page,
  accordionTitle: string,
) {
  const button = page.locator(
    `button.usa-accordion__button:has-text("${accordionTitle}"):visible`,
  );
  const timeout = targetEnv !== "local" ? 120000 : 30000;
  await button.waitFor({ state: "visible", timeout });
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const expanded = await button.getAttribute("aria-expanded");
  if (expanded !== "true") {
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true", {
      timeout: 2000,
    });
  }
}

export const getCountOfTopLevelFilterOptions = async (
  page: Page,
  filterType: string,
): Promise<number> => {
  const filterOptions = await page
    .locator(`#opportunity-filter-${filterType} > ul > li > div > input`)
    .all();

  const ids = await Promise.all(
    filterOptions.map((option) => option.getAttribute("id")),
  );
  return ids.filter((id) => !id?.match(/any$/)).length;
};

// returns the number of options available to be selected
export const selectAllTopLevelFilterOptions = async (
  page: Page,
  filterType: string,
): Promise<undefined> => {
  // gather number of (top level) filter options for filter type

  // click select all for filter type
  const selectAllButton = page
    .locator(`#opportunity-filter-${filterType} button:has-text("Select All")`)
    .first();
  await selectAllButton.click();

  // validate that url is updated
  await waitForURLContainsQueryParam(page, filterType);
};

export const validateTopLevelAndNestedSelectedFilterCounts = async (
  page: Page,
  filterName: string,
  expectedTopLevelCount: number,
  expectedNestedCount: number,
) => {
  // validate that the correct number of filter options is displayed
  const accordionButton = page.locator(
    `button[data-testid="accordionButton_opportunity-filter-${camelCase(filterName)}"]`,
  );

  await expect(accordionButton).toHaveText(
    `${filterName}${expectedTopLevelCount + expectedNestedCount}`,
  );

  const expanderButton = page.locator(
    `#opportunity-filter-${camelCase(filterName)} > ul > li:first-child > div > button`,
  );

  if (expectedNestedCount) {
    await expect(expanderButton).toContainText(`${expectedNestedCount}`);
  }
};

// The drawer does not render a numeric count in the accordion title. Selected
// state is shown by the checked options plus the simpler-selected-filter
// highlight on the accordion (SearchFilterAccordion.tsx), so assert both.
export async function expectSelectedFilterCount(
  page: Page,
  queryParamKey: string,
  expectedCount: number,
): Promise<void> {
  const accordion = page.locator(
    `[data-testid="accordionItem_opportunity-filter-${queryParamKey}"]`,
  );

  await expect(accordion.locator("input[type='checkbox']:checked")).toHaveCount(
    expectedCount,
  );

  if (expectedCount > 0) {
    await expect(accordion).toHaveClass(/simpler-selected-filter/);
  } else {
    await expect(accordion).not.toHaveClass(/simpler-selected-filter/);
  }
}

export const waitForFilterOptions = async (page: Page, filterType: string) => {
  const filterButton = page.locator(
    `button[aria-controls="opportunity-filter-${filterType}"]:visible`,
  );
  const timeout = FILTER_OPTIONS_TIMEOUT;
  await filterButton.waitFor({ state: "visible", timeout });
  await filterButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await filterButton.click();

  const filterOptions = page.locator(
    `#opportunity-filter-${filterType} label.usa-checkbox__label:visible`,
  );
  await filterOptions.first().waitFor({ state: "visible", timeout });
};
