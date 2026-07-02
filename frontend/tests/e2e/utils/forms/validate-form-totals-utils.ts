import { type Page } from "@playwright/test";
import { validatePrintViewField } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Generic validation for row-level computed totals in budget forms.
 * Useful for forms with activity-based line items that calculate row totals.
 *
 * @param page - The Playwright page object.
 * @param config - Configuration for validation:
 *   - numActivities: Number of activities to validate (default: 4)
 *   - calculateExpectedTotal: Function that calculates expected total given activity index
 *   - getRowTotalTestId: Function that returns test ID for a given activity index
 *
 * @example
 * // SF-424A validation
 * await validateBudgetFormRowTotals(page, {
 *   numActivities: 4,
 *   calculateExpectedTotal: (i) => ((i + 1) * 4).toFixed(2),
 *   getRowTotalTestId: (i) => `activity_line_items[${i}]--budget_summary--total_amount`,
 * });
 */
export async function validateBudgetFormRowTotals(
  page: Page,
  config: {
    numActivities?: number;
    calculateExpectedTotal: (activityIndex: number) => string;
    getRowTotalTestId: (activityIndex: number) => string;
  },
): Promise<void> {
  const {
    numActivities = 4,
    calculateExpectedTotal,
    getRowTotalTestId,
  } = config;

  for (let i = 0; i < numActivities; i++) {
    const expectedRowTotal = calculateExpectedTotal(i);
    const rowTotalId = getRowTotalTestId(i);
    await validatePrintViewField(page, rowTotalId, expectedRowTotal);
  }
}

/**
 * SF-424A specific row-level totals validation.
 * Validates that Section A budget summary row totals are calculated correctly.
 *
 * Test data uses unique values per activity (01, 02, 03, 04):
 * - Activity 0: value 1 -> row total should be 4.00 (1 × 4 columns)
 * - Activity 1: value 2 -> row total should be 8.00 (2 × 4 columns)
 * - Activity 2: value 3 -> row total should be 12.00 (3 × 4 columns)
 * - Activity 3: value 4 -> row total should be 16.00 (4 × 4 columns)
 *
 * Call this after form save, after submission, and/or on print view to ensure
 * that row totals are calculated correctly and catch bugs early.
 *
 * @param page - The Playwright page object.
 * @throws If any row total is missing or has an unexpected value.
 */
export async function validateSF424ARowTotals(page: Page): Promise<void> {
  await validateBudgetFormRowTotals(page, {
    numActivities: 4,
    calculateExpectedTotal: (i) => ((i + 1) * 4).toFixed(2),
    getRowTotalTestId: (i) =>
      `activity_line_items[${i}]--budget_summary--total_amount`,
  });
}
