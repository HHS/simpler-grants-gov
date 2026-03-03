// ============================================================================
// Test Report Utilities
// ============================================================================
// Helper functions for soft assertions, step execution with timing,
// and attaching detailed information to Playwright test reports.
// ============================================================================
import { expect, Locator, TestInfo } from "@playwright/test";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

// Annotation types
const ANNOTATION_SOFT_FAIL = "soft-fail";
const ANNOTATION_SKIPPED_FIELD = "skipped-field";

// Attachment types
const ATTACHMENT_SOFT_FAIL = "soft-fail-log";
const ATTACHMENT_SKIPPED_FIELD = "skipped-field-log";
const ATTACHMENT_TEST_SUMMARY = "test-summary";

const SYMBOL_TIMER = "⏱️";

// Test report message templates
const MSG_TEST_COMPLETED_WITH_FAILURES = "Test completed with";
const MSG_FAILURE_PLURAL = "failure(s)";
const MSG_FAILURES_LOGGED = "All failures have been logged to the report.";

// Error messages
const ERROR_ELEMENT_NOT_FOUND = "element not found within";

// Step messages
const MSG_TIMEOUT_NOT_FOUND = "TIMEOUT/NOT FOUND:";
const MSG_SKIPPING = "skipping";

// ============================================================================
// PRIVATE/INTERNAL HELPER FUNCTIONS
// ============================================================================

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
// SAFE ASSERTION & REPORT HELPERS
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
  label?: string,
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
    await testInfo.attach(ATTACHMENT_SOFT_FAIL, {
      body: details,
      contentType: "text/plain",
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
  locator: Locator,
  label?: string,
): Promise<void> {
  const description = label ?? "Verify locator count is 0";
  await safeHelp_safeExpect(
    testInfo,
    async () => expect(locator).toHaveCount(0),
    description,
  );
}

async function executeStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>,
): Promise<void> {
  const startTime = new Date();
  try {
    await action();
  } catch (error) {
    incrementSoftFail(testInfo);
    testInfo.annotations.push({
      type: ANNOTATION_SOFT_FAIL,
      description: `${label}: ${String(error)}`,
    });
  } finally {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    await testInfo.attach(`${label} - timing`, {
      body: `Step "${label}" completed in ${durationMs}ms`,
      contentType: "text/plain",
    });
  }
}

export async function safeHelp_softStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>,
): Promise<void> {
  await executeStep(testInfo, label, action);
}

export async function safeHelp_safeStep(
  testInfo: TestInfo,
  label: string,
  action: () => Promise<void>,
): Promise<void> {
  await executeStep(testInfo, label, action);
}

/**
 * Utility to attach a test summary to the report
 *
 * @param testInfo - Playwright TestInfo object
 * @param failureCount - Number of failures that occurred
 * @param _startTime - Test start time (unused, kept for API compatibility)
 */
export async function safeHelp_attachTestSummary(
  testInfo: TestInfo,
  failureCount: number,
  _startTime?: Date,
): Promise<void> {
  const softFailCount = Math.max(failureCount, getSoftFailCount(testInfo));
  if (softFailCount > 0) {
    await testInfo.attach(ATTACHMENT_TEST_SUMMARY, {
      body: `${MSG_TEST_COMPLETED_WITH_FAILURES} ${softFailCount} ${MSG_FAILURE_PLURAL}.\n${MSG_FAILURES_LOGGED}`,
      contentType: "text/plain",
    });
  }
}

/**
 * Attach a custom error to test report
 *
 * @param testInfo - Playwright TestInfo object
 * @param errorLabel - Label for the error attachment
 * @param errorMessage - Error message or content
 * @param contentType - MIME type (default: text/plain)
 */
export async function safeHelp_attachError(
  testInfo: TestInfo,
  errorLabel: string,
  errorMessage: string,
  contentType = "text/plain",
): Promise<void> {
  incrementSoftFail(testInfo);
  testInfo.annotations.push({
    type: ANNOTATION_SOFT_FAIL,
    description: `${errorLabel}: ${errorMessage}`,
  });
  await testInfo.attach(errorLabel, {
    body: errorMessage,
    contentType,
  });
}

/**
 * Attaches skipped field info to test report
 *
 * @param testInfo - Playwright TestInfo object
 * @param fieldInfo - Information about the skipped field
 * @param locatorString - String representation of the locator
 */
export async function safeHelp_attachSkippedField(
  testInfo: TestInfo,
  fieldInfo: string,
  locatorString: string,
): Promise<void> {
  incrementSoftFail(testInfo);
  const errorMsg = `${SYMBOL_TIMER} ${MSG_TIMEOUT_NOT_FOUND} ${fieldInfo}, ${MSG_SKIPPING}, locator: ${locatorString}`;
  testInfo.annotations.push({
    type: ANNOTATION_SKIPPED_FIELD,
    description: errorMsg,
  });
  await testInfo.attach(ATTACHMENT_SKIPPED_FIELD, {
    body: errorMsg,
    contentType: "text/plain",
  });
}

/**
 * Export constants for external use
 */
export const reportConstants = {
  ANNOTATION_SOFT_FAIL,
  ANNOTATION_SKIPPED_FIELD,
  ATTACHMENT_SOFT_FAIL,
  ATTACHMENT_SKIPPED_FIELD,
  ATTACHMENT_TEST_SUMMARY,
  SYMBOL_TIMER,
  MSG_TEST_COMPLETED_WITH_FAILURES,
  MSG_FAILURE_PLURAL,
  MSG_FAILURES_LOGGED,
  ERROR_ELEMENT_NOT_FOUND,
  MSG_TIMEOUT_NOT_FOUND,
  MSG_SKIPPING,
};

/**
 * Get current failure count for a test
 *
 * @param testInfo - Playwright TestInfo object
 * @returns Current soft fail count
 */
export function safeHelp_getSoftFailCount(testInfo: TestInfo): number {
  return getSoftFailCount(testInfo);
}
