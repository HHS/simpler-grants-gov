// ============================================================================
// Safe Help Utilities
// ============================================================================
// Helper functions for safe test execution, assertions, and form interactions
// with soft error handling that logs failures without stopping test execution
// ============================================================================

import { expect, TestInfo, Locator } from '@playwright/test';
import { getTimeout } from './timeoutHelp';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

// Wait State Configuration
const WAIT_STATES = {
  LOAD: 'load',           // Wait for load event
  DOMCONTENTLOADED: 'domcontentloaded', // Wait for DOM content loaded
  // NETWORKIDLE: 'networkidle', // Wait for network to be idle (no pending requests)
} as const;

type WaitState = typeof WAIT_STATES[keyof typeof WAIT_STATES];

// Report settings
const REPORT_BASE_URL = 'http://localhost:9323';
const REPORT_PORT = 9323;

// Timestamp formats
const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:MM:SS';
const TIMESTAMP_WITH_TIME_FORMAT = 'YYYY-DD-MM - at HH:MM:SS';

// Fiscal year configuration
const FISCAL_YEAR_START_MONTH = 9; // October (0-indexed as 9)
const FISCAL_YEAR_END_MONTH = 8; // September (0-indexed as 8)

// Error messages
const ERROR_ELEMENT_NOT_FOUND = 'element not found within';
const ERROR_OPTION_NOT_FOUND = 'option not found or element not available within';

// Annotation types
const ANNOTATION_SOFT_FAIL = 'soft-fail';
const ANNOTATION_SKIPPED_FIELD = 'skipped-field';

// Attachment types
const ATTACHMENT_SOFT_FAIL = 'soft-fail-log';
const ATTACHMENT_SKIPPED_FIELD = 'skipped-field-log';
const ATTACHMENT_TEST_SUMMARY = 'test-summary';

// //console symbols
const SYMBOL_SUCCESS = '✅';
const SYMBOL_WARNING = '⚠️';
const SYMBOL_TIMER = '⏱️';
const SYMBOL_CHART = '📊';
const SYMBOL_COUNTER = '🧮';
const SYMBOL_FAILURE = '❌';

// Test report message templates
const MSG_TEST_COMPLETED_WITH_FAILURES = 'Test completed with';
const MSG_FAILURE_PLURAL = 'failure(s)';
const MSG_FAILURES_LOGGED = 'All failures have been logged to the report.';
const MSG_TEST_STARTED = 'Test started at';
const MSG_TEST_ENDED = 'Test ended at';
const MSG_TEST_PASSED = 'Test passed with no failures, run npx playwright show-report to view details';
const MSG_TEST_FAILED = 'Test fail with';
const MSG_SOFTFAIL_COUNT = 'Softfail count:';

// Step messages
const MSG_STEP_STARTED = 'Step started';
const MSG_STEP_ENDED = 'Step ended';
const MSG_FILLED_SUCCESSFULLY = 'Filled';
const MSG_SELECTED_SUCCESSFULLY = 'Selected';
const MSG_TIMEOUT_NOT_FOUND = 'TIMEOUT/NOT FOUND:';
const MSG_SKIPPING = 'skipping';

// ============================================================================
// PRIVATE/INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Format timestamp string in format: YYYY-MM-DD - at HH:MM:SS
 * @param date - Date object to format
 * @returns Formatted timestamp string
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${day}-${month} - at ${hours}:${minutes}:${seconds}`;
}

/**
 * Extracts line number from the call stack
 * @returns Line number where function was called, or undefined if not found
 */
function extractLineNumber(): number | undefined {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');

  for (const line of lines) {
    if (line.includes('safeHelp.ts')) {
      continue;
    }
    const match = line.match(/:(\d+):\d+\)?$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Increment soft fail counter in test info
 * @param testInfo - Playwright TestInfo object
 */
function incrementSoftFail(testInfo: TestInfo): void {
  const info = testInfo as unknown as { _softFailCount?: number };
  info._softFailCount = (info._softFailCount ?? 0) + 1;
}

/**
 * Get current soft fail count from test info
 * @param testInfo - Playwright TestInfo object
 * @returns Current soft fail count
 */
function getSoftFailCount(testInfo: TestInfo): number {
  const info = testInfo as unknown as { _softFailCount?: number };
  return info._softFailCount ?? 0;
}

// ============================================================================
// SAFE ASSERTION & STEP HELPERS
// ============================================================================

/**
 * Safe assertion helper that catches assertion errors and logs them to the test report
 * instead of failing the test immediately. Useful for soft assertions that should be
 * documented but not block test execution.
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param fn - Async function containing the assertion
 * @param label - Optional label to describe the assertion
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * await safeHelp_safeExpect(testInfo, async () => expect(page.locator('h1')).toContainText('Welcome'));
 *
 * @example
 * await safeHelp_safeExpect(testInfo, async () => {
 *   expect(element1).toBeVisible();
 *   expect(element2).toHaveText('Test');
 * }, 'Header validation');
 */
export async function safeHelp_safeExpect(
  testInfo: TestInfo,
  fn: () => Promise<void>,
  label?: string
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    incrementSoftFail(testInfo);
    const details = label ? `${label}: ${String(error)}` : String(error);
    testInfo.annotations.push({
      type: ANNOTATION_SOFT_FAIL,
      description: details,
    });
    //console.log(`${SYMBOL_WARNING} ${details}`);
    await testInfo.attach(ATTACHMENT_SOFT_FAIL, {
      body: details,
      contentType: 'text/plain',
    });
  }
}

/**
 * Safe locator validation helper
 * Verifies that a locator has count 0 (typically used to verify absence of elements)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param locator - Playwright Locator object
 * @param label - Optional label to describe the assertion
 */
export async function safeHelp_ValidateTextAtLocator(
  testInfo: TestInfo,
  locator: any,
  label?: string
): Promise<void> {
  const description = label ?? 'Verify locator count is 0';
  await safeHelp_safeExpect(testInfo, async () => expect(locator).toHaveCount(0), description);
}

/**
 * Generic helper to log step timing and catch errors
 * Used internally by both softStep and safeStep
 */
async function executeStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>
): Promise<void> {
  const startTime = new Date();
  //console.log(`${SYMBOL_TIMER} ${MSG_STEP_STARTED} [${label}] at ${formatTimestamp(startTime)}`);
  try {
    await action();
  } catch (error) {
    incrementSoftFail(testInfo);
    testInfo.annotations.push({
      type: ANNOTATION_SOFT_FAIL,
      description: `${label}: ${String(error)}`,
    });
    //console.log(`${SYMBOL_WARNING} ${label}: ${String(error)}`);
  } finally {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    //console.log(
      `${SYMBOL_TIMER} ${MSG_STEP_ENDED} [${label}] at ${formatTimestamp(endTime)} (${durationMs} ms)`
    );
  }
}

/**
 * Soft step helper that catches step errors and logs them without failing the test
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param label - Description of the step
 * @param action - Async function containing the step actions
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * await safeHelp_softStep(testInfo, 'navigate to home', async () => {
 *   await page.goto('/');
 * });
 */
export async function safeHelp_softStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>
): Promise<void> {
  await executeStep(testInfo, label, action);
}

/**
 * Safe step helper that catches step errors and logs them without failing the test
 * Unlike safeHelp_softStep, safeHelp_safeStep automatically tracks soft-fail count in testInfo
 * so you don't need to manually manage a failureCount variable.
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param label - Description of the step
 * @param action - Async function containing the step actions
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * // No manual failureCount tracking needed!
 * await safeHelp_safeStep(testInfo, 'navigate to home', async () => {
 *   await page.goto('/');
 * });
 */
export async function safeHelp_safeStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>
): Promise<void> {
  await executeStep(testInfo, label, action);
}

// ============================================================================
// TEST SUMMARY
// ============================================================================

/**
 * Utility to attach a test summary to the report
 *
 * @param testInfo - Playwright TestInfo object
 * @param failureCount - Number of failures that occurred
 * @param startTime - Test start time
 */
export async function safeHelp_attachTestSummary(
  testInfo: TestInfo,
  failureCount: number,
  startTime?: Date
): Promise<void> {
  const softFailCount = Math.max(failureCount, getSoftFailCount(testInfo));
  const reportPath = `${REPORT_BASE_URL}/#?testId=${testInfo.testId}`.replace(/\\/g, '/');
  const testTitle = testInfo.title;
  const endTime = new Date();
  const endStamp = formatTimestamp(endTime);
  const startStamp = startTime ? formatTimestamp(startTime) : 'unknown';
  const durationMs = startTime ? endTime.getTime() - startTime.getTime() : undefined;

  if (softFailCount > 0) {
    await testInfo.attach(ATTACHMENT_TEST_SUMMARY, {
      body: `${MSG_TEST_COMPLETED_WITH_FAILURES} ${softFailCount} ${MSG_FAILURE_PLURAL}.\n${MSG_FAILURES_LOGGED}`,
      contentType: 'text/plain',
    });
  }

  //console.log(`\n========================================`);
  //console.log(`           TEST SUMMARY`);
  //console.log(`========================================`);
  //console.log(`${SYMBOL_COUNTER} ${MSG_SOFTFAIL_COUNT} ${softFailCount}`);

  if (softFailCount > 0) {
    //console.log(
      `${SYMBOL_FAILURE} ${MSG_TEST_FAILED} ${softFailCount} softfail(s), run npx playwright show-report to view details`
    );
  } else {
    //console.log(`${SYMBOL_SUCCESS} ${MSG_TEST_PASSED}`);
  }

  if (durationMs !== undefined) {
    //console.log(`${SYMBOL_TIMER} ${MSG_TEST_STARTED} ${startStamp}`);
    //console.log(`${SYMBOL_TIMER} ${MSG_TEST_ENDED} ${endStamp} (${durationMs} ms)`);
  } else {
    //console.log(`${SYMBOL_TIMER} ${MSG_TEST_ENDED} ${endStamp}`);
  }

  //console.log(`${SYMBOL_CHART} Test report: ${reportPath}`);
  //console.log(`========================================\n`);
}

// ============================================================================
// FORM FILLING HELPERS
// ============================================================================

/**
 * Generic helper to handle form field operations with line number tracking
 */
async function handleFieldOperation(
  testInfo: TestInfo,
  locator: any,
  operation: (loc: any) => Promise<void>,
  fieldType: string,
  timeoutMs?: number
): Promise<boolean> {
  const timeout = timeoutMs ?? getTimeout('DEFAULT');
  const lineNumber = extractLineNumber();
  const lineLabel = lineNumber ? `Line ${lineNumber}` : 'Line unknown';

  try {
    await locator.waitFor({ state: 'attached', timeout });
    await operation(locator);
    //console.log(`${SYMBOL_SUCCESS} ${fieldType} successfully (${lineLabel})`);
    return true;
  } catch (error) {
    incrementSoftFail(testInfo);
    const errorMsg = `${SYMBOL_TIMER} ${MSG_TIMEOUT_NOT_FOUND} ${lineLabel} - ${ERROR_ELEMENT_NOT_FOUND} ${timeout}ms, ${MSG_SKIPPING}`;
    testInfo.annotations.push({
      type: ANNOTATION_SKIPPED_FIELD,
      description: errorMsg,
    });
    await testInfo.attach(ATTACHMENT_SKIPPED_FIELD, {
      body: errorMsg,
      contentType: 'text/plain',
    });
    //console.log(`${SYMBOL_WARNING} ${errorMsg}`);
    return false;
  }
}

/**
 * Safe fill helper that waits for a locator with timeout and fills it
 * If locator not found within timeout, logs the error and skips to next line
 * Automatically captures the line number where safeHelp_safeFill was called
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param locator - Playwright Locator object
 * @param value - Value to fill in the locator
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves to true if filled, false if timeout/not found
 *
 * @example
 * // Uses DEFAULT timeout (30 seconds)
 * await safeHelp_safeFill(testInfo, page.getByTestId('username'), 'testuser');
 *
 * @example
 * // Custom timeout
 * await safeHelp_safeFill(testInfo, page.getByTestId('firstName'), 'John', getTimeout('FAST'));
 *
 * @example
 * // Or use TIMEOUTS constant directly
 * await safeHelp_safeFill(testInfo, page.getByTestId('slowField'), 'value', TIMEOUTS.SLOW);
 */
export async function safeHelp_safeFill(
  testInfo: TestInfo,
  locator: any,
  value: string,
  timeoutMs?: number
): Promise<boolean> {
  return handleFieldOperation(
    testInfo,
    locator,
    async (loc) => loc.fill(value),
    MSG_FILLED_SUCCESSFULLY,
    timeoutMs
  );
}

/**
 * Fill multiple fields using testId selectors
 * Reports use testId values instead of labels
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param fields - Array of field definitions (testId, value)
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves when all fields are processed
 *
 * @example
 * await safeHelp_fillFieldsByTestId(testInfo, page, [
 *   { testId: 'material_change_year', value: prevYear },
 *   { testId: 'material_change_quarter', value: quarter },
 *   { testId: 'last_report_date', value: lastDayOfPrevQuarter }
 * ]);
 *
 * @example
 * // With custom timeout
 * await safeHelp_fillFieldsByTestId(testInfo, page, fields, getTimeout('SLOW'));
 */
export async function safeHelp_fillFieldsByTestId(
  testInfo: TestInfo,
  page: any,
  fields: Array<{ testId: string; value: string }>,
  timeoutMs?: number
): Promise<void> {
  for (const field of fields) {
    await safeHelp_safeFill(testInfo, page.getByTestId(field.testId), field.value, timeoutMs);
  }
}

/**
 * Safe select option helper for dropdowns
 * If dropdown not found or option not available, logs the error and skips
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param locator - Playwright Locator for the select element
 * @param value - Value or label of the option to select
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves to true if selected, false if failed
 *
 * @example
 * // Uses DEFAULT timeout (30 seconds)
 * await safeHelp_safeSelectOption(testInfo, page.locator('#federal_action_type'), 'Grant');
 *
 * @example
 * // With custom timeout
 * await safeHelp_safeSelectOption(testInfo, page.locator('#status'), 'Active', getTimeout('SLOW'));
 */
export async function safeHelp_safeSelectOption(
  testInfo: TestInfo,
  locator: any,
  value: string,
  timeoutMs?: number
): Promise<boolean> {
  return handleFieldOperation(
    testInfo,
    locator,
    async (loc) => loc.selectOption(value),
    MSG_SELECTED_SUCCESSFULLY,
    timeoutMs
  );
}

/**
 * Safe select option helper that builds a locator from a selector string
 * Reports use selector values instead of labels
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param selector - Selector string for the select element
 * @param value - Value or label of the option to select
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves to true if selected, false if failed
 *
 * @example
 * await safeHelp_selectDropdownLocator(testInfo, page, '#federal_action_type', 'Grant');
 *
 * @example
 * // With custom timeout
 * await safeHelp_selectDropdownLocator(testInfo, page, '#status', 'Active', getTimeout('FAST'));
 */
export async function safeHelp_selectDropdownLocator(
  testInfo: TestInfo,
  page: any,
  selector: string,
  value: string,
  timeoutMs?: number
): Promise<boolean> {
  return safeHelp_safeSelectOption(testInfo, page.locator(selector), value, timeoutMs);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate timestamp string in format: YYYY-MM-DD HH:MM:SS
 * @returns Formatted timestamp string
 *
 * @example
 * const timestamp = safeHelp_getTimestamp(); // "2026-02-13 14:30:45"
 */
export function safeHelp_getTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

/**
 * Calculate current fiscal year and quarter
 * Fiscal year runs from Oct 1 - Sep 30
 *
 * @returns Object with prevYear, quarter, and lastDayOfPrevQuarter
 *
 * @example
 * const { prevYear, quarter, lastDayOfPrevQuarter } = safeHelp_getFiscalYearQuarter();
 * // Feb 2026: prevYear = "2025", quarter = "2", lastDayOfPrevQuarter = "2025-12-31"
 */
export function safeHelp_getFiscalYearQuarter(): {
  prevYear: string;
  quarter: string;
  lastDayOfPrevQuarter: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fiscalYear = month >= FISCAL_YEAR_START_MONTH ? year + 1 : year;
  const prevYear = (fiscalYear - 1).toString();

  let quarter: string;
  let lastDayOfPrevQuarter: string;

  if (month >= FISCAL_YEAR_START_MONTH && month <= 11) {
    quarter = '1';
    lastDayOfPrevQuarter = `${year - 1}-09-30`;
  } else if (month >= 0 && month <= 2) {
    quarter = '2';
    lastDayOfPrevQuarter = `${year - 1}-12-31`;
  } else if (month >= 3 && month <= 5) {
    quarter = '3';
    lastDayOfPrevQuarter = `${year}-03-31`;
  } else {
    quarter = '4';
    lastDayOfPrevQuarter = `${year}-06-30`;
  }

  return { prevYear, quarter, lastDayOfPrevQuarter };
}

/**
 * Update application name with unique timestamp and complete the setup flow
 * Updates application name with timestamp to ensure uniqueness for each test run
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @returns Object with appLinkName, prevYear, quarter, and lastDayOfPrevQuarter
 *
 * @example
 * const { appLinkName, prevYear, quarter, lastDayOfPrevQuarter } =
 *   await safeHelp_updateApplicationName(testInfo, page);
 */
export async function safeHelp_updateApplicationName(
  testInfo: TestInfo,
  page: any
): Promise<{
  appLinkName: string;
  prevYear: string;
  quarter: string;
  lastDayOfPrevQuarter: string;
}> {
  const appLinkName = `Test at ${safeHelp_getTimestamp()}`;
  const { prevYear, quarter, lastDayOfPrevQuarter } = safeHelp_getFiscalYearQuarter();

  await safeHelp_safeStep(testInfo, 'create application link', async () => {
    await page.getByTestId('sign-in-button').click();
    await page.getByTestId('textInput').fill(appLinkName);
    await page.getByRole('button', { name: 'Save' }).click();
  });

  return { appLinkName, prevYear, quarter, lastDayOfPrevQuarter };
}

/**
 * Navigate to a form by clicking a link with the specified name
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param linkName - The name/text of the link to click (e.g., 'Disclosure of Lobbying')
 *
 * @example
 * await safeHelp_navigateToForm(testInfo, page, 'Disclosure of Lobbying');
 */
export async function safeHelp_navigateToForm(
  testInfo: TestInfo,
  page: any,
  linkName: string
): Promise<void> {
  await safeHelp_safeStep(testInfo, `navigate to ${linkName}`, async () => {
    await page.getByRole('link', { name: linkName }).click();
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
  page: any
): (formName: string) => Promise<void> {
  return (formName: string) => safeHelp_navigateToForm(testInfo, page, formName);
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
 * @param waitState - Wait state: 'load', 'domcontentloaded', or 'networkidle' (default: 'networkidle')
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves when navigation completes
 *
 * @example
 * // Default - waits for load
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com');
 *
 * @example
 * // Wait for load event only (faster)
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com', 'load');
 *
 * @example
 * // With custom timeout
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com', 'networkidle', getTimeout('SLOW'));
 *
 * @example
 * // Or use TIMEOUTS constant directly
 * await safeHelp_safeGoto(testInfo, page, 'https://example.com', 'networkidle', TIMEOUTS.SLOW);
 */
export async function safeHelp_safeGoto(
  testInfo: TestInfo,
  page: any,
  url: string,
  waitState: WaitState = WAIT_STATES.LOAD,
  timeoutMs?: number
): Promise<void> {
  const timeout = timeoutMs ?? getTimeout('DEFAULT');

  await safeHelp_safeStep(testInfo, `navigate to ${url}`, async () => {
    await page.goto(url, { waitUntil: waitState, timeout });
  });
}

/**
 * Wait for page to reach a specific load state
 * Useful after clicking links or performing actions that trigger navigation
 *
 * @param testInfo - Playwright TestInfo object
 * @param page - Playwright Page object
 * @param waitState - Wait state: 'load', 'domcontentloaded', or 'networkidle' (default: 'networkidle')
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that resolves when load state is reached
 *
 * @example
 * // Wait for load (default)
 * await safeHelp_safeWaitForLoadState(testInfo, page);
 *
 * @example
 * // Wait for load event only (faster)
 * await safeHelp_safeWaitForLoadState(testInfo, page, 'load');
 *
 * @example
 * // Wait for load with custom timeout
 * await safeHelp_safeWaitForLoadState(testInfo, page, 'networkidle', getTimeout('SLOW'));
 *
 * @example
 * // Or use TIMEOUTS constant directly
 * await safeHelp_safeWaitForLoadState(testInfo, page, 'networkidle', TIMEOUTS.EXTENDED);
 */
export async function safeHelp_safeWaitForLoadState(
  testInfo: TestInfo,
  page: any,
  waitState: WaitState = WAIT_STATES.LOAD,
  timeoutMs?: number
): Promise<void> {
  const timeout = timeoutMs ?? getTimeout('DEFAULT');
  const label = `wait for page load state: ${waitState}`;

  await safeHelp_safeStep(testInfo, label, async () => {
    await page.waitForLoadState(waitState, { timeout });
  });
}

/**
 * Safe form save helper that clicks save button with soft error handling
 * If save fails, logs the error and continues test execution (soft fail)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param page - Playwright Page object
 * @param timeoutMs - Optional timeout in milliseconds. If not provided, uses DEFAULT timeout (30000ms)
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * await safeHelp_saveForm(testInfo, page);
 *
 * @example
 * // With custom timeout
 * await safeHelp_saveForm(testInfo, page, getTimeout('SLOW'));
 */
export async function safeHelp_saveForm(
  testInfo: TestInfo,
  page: any,
  timeoutMs?: number
): Promise<void> {
  const timeout = timeoutMs ?? getTimeout('DEFAULT');

  await safeHelp_safeStep(testInfo, 'save form', async () => {
    const saveButton = page.getByTestId('apply-form-save');
    await saveButton.waitFor({ state: 'visible', timeout });
    await saveButton.click();
  });
}

/**
 * Safe link click helper that clicks a link with soft error handling
 * If click fails, logs the error and continues test execution (soft fail)
 *
 * @param testInfo - Playwright TestInfo object for attaching to report
 * @param locator - Playwright Locator object for the link element
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Submit' }));
 */
export async function safeHelp_clickLink(
  testInfo: TestInfo,
  locator: Locator
): Promise<void> {
  await safeHelp_safeStep(testInfo, 'click link', async () => {
    await locator.click();
    await locator.page().waitForTimeout(500); // Wait for scroll/focus animation
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
 * @returns Promise that always resolves, never rejects
 *
 * @example
 * await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
 */
export async function safeHelp_clickButton(
  testInfo: TestInfo,
  page: any,
  stepName: string,
  testId: string
): Promise<void> {
  await safeHelp_safeStep(testInfo, stepName, async () => {
    await page.getByTestId(testId).click();
  });
}
