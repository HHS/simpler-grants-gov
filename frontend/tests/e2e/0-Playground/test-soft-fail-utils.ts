// // ============================================================================
// // Test Soft Fail Utilities (Core)
// // ============================================================================
// // Core soft-fail primitives shared by specialized helper modules.
// // This file intentionally keeps only soft-fail behavior.
// // ============================================================================

// import { expect, Locator, TestInfo } from "@playwright/test";

// const ANNOTATION_SOFT_FAIL = "soft-fail";
// const ATTACHMENT_SOFT_FAIL = "soft-fail-log";
// const ATTACHMENT_TEST_SUMMARY = "test-summary";
// const MSG_TEST_COMPLETED_WITH_FAILURES = "Test completed with";
// const MSG_FAILURE_PLURAL = "failure(s)";
// const MSG_FAILURES_LOGGED = "All failures have been logged to the report.";

// function incrementSoftFail(testInfo: TestInfo): void {
//   const info = testInfo as unknown as { _softFailCount?: number };
//   info._softFailCount = (info._softFailCount ?? 0) + 1;
// }

// function getSoftFailCount(testInfo: TestInfo): number {
//   const info = testInfo as unknown as { _softFailCount?: number };
//   return info._softFailCount ?? 0;
// }

// export async function safeHelp_safeExpect(
//   testInfo: TestInfo,
//   fn: () => Promise<void>,
//   label?: string,
// ): Promise<void> {
//   try {
//     await fn();
//   } catch (error) {
//     incrementSoftFail(testInfo);
//     const details = label ? `${label}: ${String(error)}` : String(error);
//     testInfo.annotations.push({
//       type: ANNOTATION_SOFT_FAIL,
//       description: details,
//     });
//     await testInfo.attach(ATTACHMENT_SOFT_FAIL, {
//       body: details,
//       contentType: "text/plain",
//     });
//   }
// }

// export async function safeHelp_ValidateTextAtLocator(
//   testInfo: TestInfo,
//   locator: Locator,
//   label?: string,
// ): Promise<void> {
//   const description = label ?? "Verify locator count is 0";
//   await safeHelp_safeExpect(
//     testInfo,
//     async () => expect(locator).toHaveCount(0),
//     description,
//   );
// }

// async function executeStep(
//   testInfo: TestInfo,
//   label: string,
//   action: () => Promise<void>,
// ): Promise<void> {
//   const startTime = new Date();
//   try {
//     await action();
//   } catch (error) {
//     incrementSoftFail(testInfo);
//     testInfo.annotations.push({
//       type: ANNOTATION_SOFT_FAIL,
//       description: `${label}: ${String(error)}`,
//     });
//   } finally {
//     const endTime = new Date();
//     const durationMs = endTime.getTime() - startTime.getTime();
//     await testInfo.attach(`${label} - timing`, {
//       body: `Step "${label}" completed in ${durationMs}ms`,
//       contentType: "text/plain",
//     });
//   }
// }

// export async function safeHelp_softStep(
//   testInfo: TestInfo,
//   label: string,
//   action: () => Promise<void>,
// ): Promise<void> {
//   await executeStep(testInfo, label, action);
// }

// export async function safeHelp_safeStep(
//   testInfo: TestInfo,
//   label: string,
//   action: () => Promise<void>,
// ): Promise<void> {
//   await executeStep(testInfo, label, action);
// }

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
