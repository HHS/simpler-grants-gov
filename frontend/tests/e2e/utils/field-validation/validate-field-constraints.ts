import { Page, TestInfo } from "@playwright/test";
import { FieldConfig, ValidationSummaryReport } from "./types/field-config";
import {
  appendToReport,
  attachReportToTest,
  createEmptySummaryReport,
  printValidationReport,
} from "./utils/validation-reporter";
import { detectConstraintsFromDom } from "./utils/test-data-generators";
import { validateLengthConstraints } from "./validators/length-validator";
import { validateNumericConstraints } from "./validators/numeric-validator";
import { validateRequiredField } from "./validators/required-validator";
import { validatePatternConstraint } from "./validators/pattern-validator";
import { validateTypeInputConstraints } from "./validators/type-input-validator";

/**
 * Core validation orchestrator.
 *
 * Iterates over every FieldConfig in `fields`, auto-detects DOM constraints
 * when requested, and runs all configured validation rules against the live
 * Playwright page.
 *
 * Uses `expect.soft()` internally so that a failure in one check does not
 * abort subsequent checks — the entire field list is always exercised.
 *
 * @param page     - Playwright Page under test
 * @param fields   - Array of FieldConfig definitions describing each field
 * @param testInfo - Optional Playwright TestInfo; when provided, attaches the
 *                   report to the test output for CI visibility
 *
 * @returns        A fully populated ValidationSummaryReport
 */
export async function validateFieldConstraints(
  page: Page,
  fields: FieldConfig[],
  testInfo?: TestInfo,
): Promise<ValidationSummaryReport> {
  const report = createEmptySummaryReport();

  for (const rawConfig of fields) {
    // Optionally enrich config with DOM-detected constraints
    const config = rawConfig.autoDetectConstraints
      ? await detectConstraintsFromDom(page, rawConfig.locator, rawConfig)
      : rawConfig;

    console.log(
      `\n──── Validating field: "${config.label}" [${config.type}] ────`,
    );

    // Run each validator and accumulate results
    const allResults = [
      ...(await validateRequiredField(page, config)),
      ...(await validateLengthConstraints(page, config)),
      ...(await validateNumericConstraints(page, config)),
      ...(await validatePatternConstraint(page, config)),
      ...(await validateTypeInputConstraints(page, config)),
    ];

    for (const result of allResults) {
      appendToReport(report, result);
    }
  }

  printValidationReport(report);

  if (testInfo) {
    await attachReportToTest(page, report, testInfo);
  }

  return report;
}
