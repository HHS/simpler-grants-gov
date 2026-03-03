// ============================================================================
// Test Navigation & Interaction Utilities
// ============================================================================
// Helper functions for page navigation, form interaction, and element clicking
// with soft error handling via safeHelp_safeStep
// ============================================================================

import { Locator, Page, TestInfo, TestType } from "@playwright/test";
import { safeHelp_safeStep } from "tests/e2e/utils/test-report-utils";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Timeout Presets
 * Define standard timeout values for different types of operations
 */
const TIMEOUTS = {
  INSTANT: 5000, // Quick operations (5 seconds)
  FAST: 10000, // Fast-loading fields (10 seconds)
  DEFAULT: 30000, // Default timeout for most operations (30 seconds)
  SLOW: 60000, // Slow-loading fields (60 seconds)
  EXTENDED: 120000, // Extended timeout for complex operations (2 minutes)
} as const;

// Wait State Configuration
const WAIT_STATES = {
  DOMCONTENTLOADED: "domcontentloaded",
  LOAD: "load",
} as const;

type WaitState = "domcontentloaded" | "load";

// ============================================================================
// FORM NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to a form by clicking a link with the specified name
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param linkName - The name/text of the link to click (e.g., 'Disclosure of Lobbying')
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * await safeHelp_navigateToForm(testInfo, page, 'Disclosure of Lobbying');
 */
export async function safeHelp_navigateToForm(
  testInfo: TestInfo,
  page: Page,
  linkName: string,
): Promise<void> {
  await safeHelp_safeStep(testInfo, `navigate to ${linkName}`, async () => {
    await page.getByRole("link", { name: linkName }).click();
  });
}

/**
 * Create a helper function that navigates to a form by name
 * Returns a function that can be called with a form name
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @returns Function that accepts a form name and navigates to it
 *
 * @example
 * const goToForm = safeHelp_GotoForm(testInfo, page);
 * await goToForm('Disclosure of Lobbying');
 */
export function safeHelp_GotoForm(
  testInfo: TestInfo,
  page: Page,
): (formName: string) => Promise<void> {
  return (formName: string) =>
    safeHelp_navigateToForm(testInfo, page, formName);
}

// ============================================================================
// PAGE NAVIGATION & LOAD HELPERS
// ============================================================================

/**
 * Safe page navigation with configurable wait state
 * Navigates to URL and waits for page to load
 *
 * @param testInfo - Playwright TestInfo object
 * @param page - Playwright Page object
 * @param url - URL to navigate to
 * @param waitState - Wait state: 'load' or 'domcontentloaded' (default: 'load')
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * // Default - waits for load
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com');
 *
 * @example
 * // Wait for domcontentloaded event only (faster)
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com', 'domcontentloaded');
 *
 * @example
 * // With custom timeout
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com', 'load', TIMEOUTS.SLOW);
 */
export async function safeHelp_safeGoto(
  testInfo: TestInfo,
  page: Page,
  url: string,
  waitState: WaitState = WAIT_STATES.LOAD,
  timeoutMs?: number,
): Promise<void> {
  const timeout = timeoutMs ?? TIMEOUTS.DEFAULT;

  await safeHelp_safeStep(testInfo, `navigate to ${url}`, async () => {
    await page.goto(url, { waitUntil: waitState, timeout });

    // Capture page header after navigation
    try {
      const header = await page
        .locator("h1")
        .first()
        .textContent({ timeout: TIMEOUTS.FAST });
      if (header) {
        await testInfo.attach("page-header", {
          body: `Found page header: ${header.trim()}`,
          contentType: "text/plain",
        });
      }
    } catch (error) {
      // Header not found or timeout - continue silently
    }
  });
}

/**
 * Wait for page to reach a specific load state
 * Useful after clicking links or performing actions that trigger navigation
 *
 * @param testInfo - Playwright TestInfo object
 * @param page - Playwright Page object
 * @param waitState - Wait state: 'load' or 'domcontentloaded' (default: 'load')
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * // Wait for load (default)
 * await safeHelp_safeWaitForLoadState(testInfo, page);
 *
 * @example
 * // Wait for domcontentloaded event only (faster)
 * await safeHelp_safeWaitForLoadState(testInfo, page, 'domcontentloaded');
 *
 * @example
 * // Wait for load with custom timeout
 * await safeHelp_safeWaitForLoadState(testInfo, page, 'load', TIMEOUTS.SLOW);
 */
export async function safeHelp_safeWaitForLoadState(
  testInfo: TestInfo,
  page: Page,
  waitState: WaitState = WAIT_STATES.LOAD,
  timeoutMs?: number,
): Promise<void> {
  const timeout = timeoutMs ?? TIMEOUTS.DEFAULT;
  const label = `wait for page load state: ${waitState}`;

  await safeHelp_safeStep(testInfo, label, async () => {
    await page.waitForLoadState(waitState, { timeout });
  });
}

// ============================================================================
// BUTTON & LINK CLICK HELPERS
// ============================================================================

/**
 * Safe form save helper that clicks save button with soft error handling
 * If save fails, logs the error and continues test execution (soft fail)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * await safeHelp_saveForm(testInfo, page);
 *
 * @example
 * // With custom timeout
 * await safeHelp_saveForm(testInfo, page, TIMEOUTS.SLOW);
 */
export async function safeHelp_saveForm(
  testInfo: TestInfo,
  page: Page,
  timeoutMs?: number,
): Promise<void> {
  const timeout = timeoutMs ?? TIMEOUTS.DEFAULT;

  await safeHelp_safeStep(testInfo, "save form", async () => {
    const saveButton = page.getByTestId("apply-form-save");
    await saveButton.waitFor({ state: "visible", timeout });
    await saveButton.click();
  });
}

/**
 * Safe link click helper that clicks a link with soft error handling
 * If click fails, logs the error and continues test execution (soft fail)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param locator - Playwright Locator object for the link element
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Submit' }));
 */
export async function safeHelp_clickLink(
  testInfo: TestInfo,
  locator: Locator,
): Promise<void> {
  await safeHelp_safeStep(testInfo, "click link", async () => {
    await locator.click();
    // Playwright's auto-wait handles navigation and animations automatically
  });
}

/**
 * Safe click helper that clicks an element by test ID with soft error handling
 * If click fails, logs the error and continues test execution (soft fail)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param stepName - Name/description of the step for logging
 * @param testId - Test ID of the element to click
 * @returns Promise that always resolves, never rejects (soft fail)
 *
 * @example
 * await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
 */
export async function safeHelp_clickButton(
  testInfo: TestInfo,
  page: Page,
  stepName: string,
  testId: string,
): Promise<void> {
  await safeHelp_safeStep(testInfo, stepName, async () => {
    await page.getByTestId(testId).click();
  });
}

// ============================================================================
// TEST LIFECYCLE HELPERS
// ============================================================================

/**
 * Ensures that the page is closed after each test to prevent resource leaks.
 * Call this helper at the top of your test files: ensurePageClosedAfterEach(test);
 *
 * @param test - Playwright test object
 *
 * @example
 * ensurePageClosedAfterEach(test);
 */
export function ensurePageClosedAfterEach(
  test: TestType<{ page: Page }, object>,
) {
  test.afterEach(async ({ page }) => {
    if (typeof page.isClosed === "function" && !page.isClosed()) {
      await page.close();
    }
  });
}

// ============================================================================
// EXPORTED CONSTANTS
// ============================================================================

export const navigationConstants = {
  TIMEOUTS,
  WAIT_STATES,
};
