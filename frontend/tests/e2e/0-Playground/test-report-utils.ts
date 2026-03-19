// import { expect, Locator, TestInfo } from "@playwright/test";

// // Annotation types
// const ANNOTATION_SKIPPED_FIELD = "skipped-field";

// // Attachment types
// const ATTACHMENT_SKIPPED_FIELD = "skipped-field-log";
// const ATTACHMENT_TEST_SUMMARY = "test-summary";

// const SYMBOL_TIMER = "⏱️";

// // Test report message templates
// // const MSG_TEST_COMPLETED_WITH_FAILURES = "Test completed with";
// const MSG_FAILURE_PLURAL = "failure(s)";
// const MSG_FAILURES_LOGGED = "All failures have been logged to the report.";

// // Error messages
// const ERROR_ELEMENT_NOT_FOUND = "element not found within";

// // Step messages
// const MSG_TIMEOUT_NOT_FOUND = "TIMEOUT/NOT FOUND:";
// const MSG_SKIPPING = "skipping";

// /**
//  * Get current soft fail count from test info
//  * @param testInfo - Playwright TestInfo object
//  * @returns Current soft fail count
//  */
// function getSoftFailCount(testInfo: TestInfo): number {
//   const info = testInfo as unknown as { _softFailCount?: number };
//   return info._softFailCount ?? 0;
// }

// /**
//  * Utility to attach a test summary to the report
//  *
//  * @param testInfo - Playwright TestInfo object
//  * @param failureCount - Number of failures that occurred
//  * @param _startTime - Test start time (unused, kept for API compatibility)
//  */
// export async function safeHelp_attachTestSummary(
//   testInfo: TestInfo,
//   failureCount: number,
//   _startTime?: Date,
// ): Promise<void> {
//   const softFailCount = Math.max(failureCount, getSoftFailCount(testInfo));
//   if (softFailCount > 0) {
//     await testInfo.attach(ATTACHMENT_TEST_SUMMARY, {
//       body: `${MSG_TEST_COMPLETED_WITH_FAILURES} ${softFailCount} ${MSG_FAILURE_PLURAL}.\n${MSG_FAILURES_LOGGED}`,
//       contentType: "text/plain",
//     });
//   }
// }

// /**
//  * Export constants for external use
//  */
// export const reportConstants = {
//   ANNOTATION_SKIPPED_FIELD,
//   ATTACHMENT_SKIPPED_FIELD,
//   ATTACHMENT_TEST_SUMMARY,
//   SYMBOL_TIMER,
//   MSG_TEST_COMPLETED_WITH_FAILURES,
//   MSG_FAILURE_PLURAL,
//   MSG_FAILURES_LOGGED,
//   ERROR_ELEMENT_NOT_FOUND,
//   MSG_TIMEOUT_NOT_FOUND,
//   MSG_SKIPPING,
// };

// /**
//  * Get current failure count for a test
//  *
//  * @param testInfo - Playwright TestInfo object
//  * @returns Current soft fail count
//  */
// export function safeHelp_getSoftFailCount(testInfo: TestInfo): number {
//   return getSoftFailCount(testInfo);
// }
