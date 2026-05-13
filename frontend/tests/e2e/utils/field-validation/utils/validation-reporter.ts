import { Page } from "@playwright/test";
import {
  FieldValidationResult,
  ValidationSummaryReport,
} from "../types/field-config";

/**
 * Formats a single FieldValidationResult as a human-readable console log line.
 */
function formatResultLine(result: FieldValidationResult): string {
  const status = result.passed ? "✅ PASS" : "❌ FAIL";
  return (
    `  ${status} | [${result.fieldLabel}] [${result.validationType}]\n` +
    `         Input  : "${result.inputValue}"\n` +
    `         Expected: ${result.expectedBehavior}\n` +
    `         Actual  : ${result.actualBehavior}`
  );
}

/**
 * Logs a single FieldValidationResult to the console immediately.
 */
export function logResult(result: FieldValidationResult): void {
  console.log(formatResultLine(result));
}

/**
 * Prints the full validation summary report to the console with a
 * human-readable pass/fail breakdown.
 *
 * @param report - Aggregated ValidationSummaryReport to print
 */
export function printValidationReport(report: ValidationSummaryReport): void {
  console.log("\n══════════════════════════════════════════════════");
  console.log("       FIELD VALIDATION SUMMARY REPORT");
  console.log("══════════════════════════════════════════════════");
  console.log(
    `  Total checks : ${report.totalChecks}` +
      `  |  Passed : ${report.passed}` +
      `  |  Failed : ${report.failed}`,
  );
  console.log("──────────────────────────────────────────────────");

  if (report.results.length > 0) {
    for (const result of report.results) {
      console.log(formatResultLine(result));
    }
  } else {
    console.log("  No validation checks were executed.");
  }

  console.log("══════════════════════════════════════════════════\n");
}

/**
 * Builds an empty ValidationSummaryReport to accumulate results into.
 */
export function createEmptySummaryReport(): ValidationSummaryReport {
  return { totalChecks: 0, passed: 0, failed: 0, results: [] };
}

/**
 * Appends a FieldValidationResult to a summary report and updates the counters.
 *
 * @param report - Report to update in place
 * @param result - Result to append
 */
export function appendToReport(
  report: ValidationSummaryReport,
  result: FieldValidationResult,
): void {
  report.results.push(result);
  report.totalChecks++;
  if (result.passed) {
    report.passed++;
  } else {
    report.failed++;
  }
  logResult(result);
}

/**
 * Attaches the validation summary report as a Playwright test attachment
 * so it is visible in HTML reports and CI artifacts.
 *
 * Call this at the end of a test that uses validateFieldConstraints.
 *
 * @param page   - Playwright Page (used to access test.info() indirectly)
 * @param report - Report to attach
 */
export async function attachReportToTest(
  _page: Page,
  report: ValidationSummaryReport,
  testInfo: import("@playwright/test").TestInfo,
): Promise<void> {
  const lines: string[] = [
    "FIELD VALIDATION SUMMARY REPORT",
    `Total: ${report.totalChecks}  Passed: ${report.passed}  Failed: ${report.failed}`,
    "",
    ...report.results.map(
      (r) =>
        `[${r.passed ? "PASS" : "FAIL"}] ${r.fieldLabel} | ${r.validationType}\n` +
        `  Input   : ${r.inputValue}\n` +
        `  Expected: ${r.expectedBehavior}\n` +
        `  Actual  : ${r.actualBehavior}`,
    ),
  ];

  await testInfo.attach("field-validation-report.txt", {
    body: lines.join("\n"),
    contentType: "text/plain",
  });
}
