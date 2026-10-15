/**
 * @featureArea Search
 * @feature Filter Drawer Open / Close Behavior
 * @description Validates opening and closing the filter drawer (button, close X, View results, outside click, keyboard), focus handling, filter persistence across open/close, and drawer behavior after reload. Viewport coverage comes from the Playwright projects (Chrome, Mobile chrome).
 */

import { expect, test } from "@playwright/test";
import { waitForURLContainsQueryParamValues } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  clickOutsideFilterDrawer,
  closeFilterDrawerWithCloseButton,
  closeFilterDrawerWithViewResults,
  ELIGIBILITY_COUNTY,
  ensureAccordionExpanded,
  expectCheckboxIDIsChecked,
  expectFilterDrawerFitsViewport,
  expectFocusInsideFilterDrawer,
  expectSelectedFilterCount,
  FUNDING_INSTRUMENT_GRANT,
  getFilterDrawer,
  getFilterDrawerToggle,
  gotoSearchPage,
  LOGIN_STATES,
  openFilterDrawer,
  selectAdditionalFilters,
  toggleCheckboxGroup,
} from "tests/e2e/utils/search/search-filter-utils";
import { waitForSearchResultsInitialLoad } from "tests/e2e/utils/search/search-utils";

const { DISCOVERY, FULL_REGRESSION } = VALID_TAGS;

const TEST_TIMEOUT = 180_000;
const KEYS = ["Enter", "Space"] as const;

for (const loginState of LOGIN_STATES) {
  test.describe(`Filter drawer - open / close (${loginState})`, () => {
    // Scenario: Drawer opens when clicking the 'Filters' button
    test(
      "drawer opens when clicking the Filters button",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        // Given I am on the Search Funding Opportunity page
        await gotoSearchPage(page, context, testInfo, loginState);
        await expect(getFilterDrawer(page)).toBeHidden();

        // When I click the 'Filters' button
        await getFilterDrawerToggle(page).click();

        // Then the drawer should be visible
        await expect(getFilterDrawer(page)).toBeVisible();
      },
    );

    // Scenario: Drawer closes when clicking the close (X) button
    test(
      "drawer closes when clicking the close (X) button",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I click the close (X) button
        // Then the drawer should not be visible
        await closeFilterDrawerWithCloseButton(page);
      },
    );

    // Scenario: Drawer closes when clicking 'View Results'
    test(
      "drawer closes when clicking View results",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I click the 'View Results' button
        // Then the drawer should not be visible
        await closeFilterDrawerWithViewResults(page);
      },
    );

    // Scenario: Selected filters persist after closing and reopening the drawer
    test(
      "selected filters persist after closing and reopening the drawer",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I select one or more filters
        await ensureAccordionExpanded(page, "Funding instrument");
        await toggleCheckboxGroup(page, FUNDING_INSTRUMENT_GRANT);
        await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
          "grant",
        ]);

        // And I close the drawer
        await closeFilterDrawerWithCloseButton(page);

        // And I reopen the drawer
        await openFilterDrawer(page);

        // Then the previously selected filters should still be selected
        await ensureAccordionExpanded(page, "Funding instrument");
        for (const id of Object.keys(FUNDING_INSTRUMENT_GRANT)) {
          await expectCheckboxIDIsChecked(page, id);
        }

        // And the drawer should display the selected filter counts correctly
        await expectSelectedFilterCount(page, "fundingInstrument", 1);
      },
    );

    // Scenario: Drawer open/close does not reset filter selections
    test(
      "drawer open/close does not reset filter selections",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I select multiple filters (Funding instrument + Eligibility)
        await selectAdditionalFilters(page);

        // And I close the drawer
        await closeFilterDrawerWithViewResults(page);

        // And I reopen the drawer
        await openFilterDrawer(page);

        // Then all previously selected filters should remain selected
        await ensureAccordionExpanded(page, "Funding instrument");
        await ensureAccordionExpanded(page, "Eligibility");
        for (const id of [
          ...Object.keys(FUNDING_INSTRUMENT_GRANT),
          ...Object.keys(ELIGIBILITY_COUNTY),
        ]) {
          await expectCheckboxIDIsChecked(page, id);
        }
        await expectSelectedFilterCount(page, "fundingInstrument", 1);
        await expectSelectedFilterCount(page, "eligibility", 1);
      },
    );

    // Scenario: Drawer closes when clicking outside the drawer area
    // (desktop / tablet only: on mobile the drawer fills the viewport)
    test(
      "drawer closes when clicking outside the drawer area",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);
        test.skip(
          /mobile/i.test(testInfo.project.name),
          "Drawer fills the viewport on mobile; nothing outside it to click",
        );

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I click outside the drawer
        await clickOutsideFilterDrawer(page);

        // Then the drawer should not be visible
        await expect(getFilterDrawer(page)).toBeHidden();
      },
    );

    // Scenario: Drawer should not break if opened multiple times quickly
    test(
      "drawer does not break when the Filters button is clicked rapidly",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        const pageErrors: string[] = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I click the 'Filters' button multiple times rapidly
        // (dispatched in one tick: once open, the overlay covers the button,
        // so real pointer clicks would land on the overlay instead)
        await getFilterDrawerToggle(page).evaluate((button: HTMLElement) => {
          for (let i = 0; i < 5; i++) button.click();
        });

        // Then the drawer should be visible
        await expect(getFilterDrawer(page)).toBeVisible();
        await expectFocusInsideFilterDrawer(page);

        // And no errors should occur
        expect(pageErrors).toEqual([]);
      },
    );

    // Scenario: Drawer opens/closes using keyboard shortcuts
    for (const key of KEYS) {
      test(
        `drawer opens and closes using the ${key} key`,
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page, context }, testInfo) => {
          test.setTimeout(TEST_TIMEOUT);

          await gotoSearchPage(page, context, testInfo, loginState);

          // When I focus on the 'Filters' button
          await getFilterDrawerToggle(page).focus();

          // And I press "<key>"
          await page.keyboard.press(key);

          // Then the drawer should open
          await expect(getFilterDrawer(page)).toBeVisible();
          await expectFocusInsideFilterDrawer(page);

          // And pressing "<key>" on the focused View results button closes it
          const viewResults = getFilterDrawer(page).locator(
            "button[data-testid='close-drawer']",
          );
          await viewResults.focus();
          await page.keyboard.press(key);
          await expect(getFilterDrawer(page)).toBeHidden();
        },
      );
    }

    // Scenario: Focus moves correctly when drawer opens/closes
    test(
      "focus moves into the drawer on open and returns to the Filters button on close",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer (via keyboard so the button holds focus)
        await getFilterDrawerToggle(page).focus();
        await page.keyboard.press("Enter");
        await expect(getFilterDrawer(page)).toBeVisible();

        // Then the focus should move into the drawer
        await expectFocusInsideFilterDrawer(page);

        // When I close the drawer
        await closeFilterDrawerWithCloseButton(page);

        // Then the focus should return to the 'Filters' button
        await expect(getFilterDrawerToggle(page)).toBeFocused();
      },
    );

    // Scenario: Drawer opens correctly on different viewport sizes
    // (viewport comes from the Playwright project: Chrome / Mobile chrome)
    test(
      "drawer opens correctly and fits the viewport",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // Then the drawer should be visible
        await expect(getFilterDrawer(page)).toBeVisible();

        // And it should not overlap critical UI elements
        await expectFilterDrawerFitsViewport(page);
      },
    );

    // Scenario: Drawer persists open/close state after page reload
    // (feature expects the drawer to be closed after reload)
    test(
      "drawer is closed after page reload",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // When I open the drawer
        await openFilterDrawer(page);

        // And I reload the page
        await page.reload();
        await waitForSearchResultsInitialLoad(page);

        // Then the drawer should close
        await expect(getFilterDrawer(page)).toBeHidden();
      },
    );
  });
}
