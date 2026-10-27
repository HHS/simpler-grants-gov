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
  expectFilterDrawerClosed,
  expectFilterDrawerFitsViewport,
  expectFocusInsideFilterDrawer,
  expectFocusReturnedToFilterDrawerToggle,
  expectSelectedFilterCount,
  FUNDING_INSTRUMENT_GRANT,
  FUNDING_INSTRUMENT_OTHER,
  getFilterDrawer,
  getFilterDrawerToggle,
  gotoSearchPage,
  LOGIN_STATES,
  openFilterDrawer,
  openFilterDrawerWithKeyboard,
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
        await expectFilterDrawerClosed(page);

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
        // (the UI has no numeric badge: count = checked options + highlighted
        // accordion, see expectSelectedFilterCount)
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

        // And I select multiple filters: two in Funding instrument (same
        // group) plus one in Eligibility (different group)
        await selectAdditionalFilters(page);
        await toggleCheckboxGroup(page, FUNDING_INSTRUMENT_OTHER);
        await waitForURLContainsQueryParamValues(page, "fundingInstrument", [
          "grant",
          "other",
        ]);

        // And I close the drawer
        await closeFilterDrawerWithViewResults(page);

        // And I reopen the drawer
        await openFilterDrawer(page);

        // Then all previously selected filters should remain selected
        await ensureAccordionExpanded(page, "Funding instrument");
        await ensureAccordionExpanded(page, "Eligibility");
        for (const id of [
          ...Object.keys(FUNDING_INSTRUMENT_GRANT),
          ...Object.keys(FUNDING_INSTRUMENT_OTHER),
          ...Object.keys(ELIGIBILITY_COUNTY),
        ]) {
          await expectCheckboxIDIsChecked(page, id);
        }
        await expectSelectedFilterCount(page, "fundingInstrument", 2);
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
        await expectFilterDrawerClosed(page);
      },
    );

    // Scenario: Drawer should not break if opened multiple times quickly
    test(
      "drawer does not break when the Filters button is clicked rapidly",
      { tag: [DISCOVERY, FULL_REGRESSION] },
      async ({ page, context }, testInfo) => {
        test.setTimeout(TEST_TIMEOUT);

        await gotoSearchPage(page, context, testInfo, loginState);

        // Listen only after load so unrelated page-load noise is not counted
        const pageErrors: string[] = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("console", (message) => {
          // The save-search modal (logged in) logs a known a11y console error
          // ("... is missing aria-describedby attribute") when it mounts. It is
          // an app issue unrelated to rapid Filters clicks, so don't count it.
          if (
            message.type() === "error" &&
            !/is missing aria-describedby attribute/.test(message.text())
          ) {
            pageErrors.push(message.text());
          }
        });

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

        // And the drawer still works: it closes and reopens normally
        await closeFilterDrawerWithCloseButton(page);
        await openFilterDrawer(page);
        await expectFocusInsideFilterDrawer(page);
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
          await expectFilterDrawerClosed(page);
        },
      );
    }

    // Scenario: Focus moves correctly when drawer opens/closes
    // (checked for every way of closing the drawer)
    for (const closeMethod of [
      "close (X) button",
      "View results",
      "outside click",
    ]) {
      test(
        `focus moves into the drawer on open and returns to the Filters button on close via ${closeMethod}`,
        { tag: [DISCOVERY, FULL_REGRESSION] },
        async ({ page, context }, testInfo) => {
          test.setTimeout(TEST_TIMEOUT);
          test.skip(
            closeMethod === "outside click" &&
              /mobile/i.test(testInfo.project.name),
            "Drawer fills the viewport on mobile; nothing outside it to click",
          );

          await gotoSearchPage(page, context, testInfo, loginState);

          // When I open the drawer (via keyboard so the button holds focus)
          await openFilterDrawerWithKeyboard(page, "Enter");

          // Then the focus should move into the drawer
          await expectFocusInsideFilterDrawer(page);

          // When I close the drawer
          if (closeMethod === "close (X) button") {
            await closeFilterDrawerWithCloseButton(page);
          } else if (closeMethod === "View results") {
            await closeFilterDrawerWithViewResults(page);
          } else {
            await clickOutsideFilterDrawer(page);
            await expectFilterDrawerClosed(page);
          }

          // Then the focus should return to the 'Filters' button
          await expectFocusReturnedToFilterDrawerToggle(page);
        },
      );
    }

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
        await expectFilterDrawerClosed(page);
      },
    );
  });
}
