import { expect, type Page } from "@playwright/test";
import { SF424C_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424c-field-definitions";
import { createFlexibleValuePattern } from "tests/e2e/utils/common/value-pattern-utils";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data for SF-424C.
 *
 * SF-424C does not define required fields at the JSON-schema level.
 * The E2E happy path nevertheless populates every user-editable field
 * so that the calculated values can be validated end-to-end.
 *
 * Table 1:
 *   total_allowable_cost = total_cost - non_allowable_cost
 *
 * Calculated rows:
 *   subtotal_1 = rows 1-11
 *   subtotal_2 = subtotal_1 + contingencies
 *   total_project_costs = subtotal_2 - project_income
 *
 * Table 2:
 *   federal_funding_share =
 *     total_project_costs * federal_percentage_share / 100
 */
export const buildSF424CHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // -------------------------------------------------------------------------
    // Table 1 - Rows 0-10 (user-entered budget items)
    // Each row: Total Cost = 1000, Non-allowable Cost = 100 (10%)
    // -------------------------------------------------------------------------

    "budget_information--administrative_and_legal_expenses--total_cost": "1000",
    "budget_information--administrative_and_legal_expenses--non_allowable_cost":
      "100",

    "budget_information--land_structures_rights_of_way--total_cost": "1000",
    "budget_information--land_structures_rights_of_way--non_allowable_cost":
      "100",

    "budget_information--relocation_expenses--total_cost": "1000",
    "budget_information--relocation_expenses--non_allowable_cost": "100",

    "budget_information--architectural_engineering_fees--total_cost": "1000",
    "budget_information--architectural_engineering_fees--non_allowable_cost":
      "100",

    "budget_information--other_architectural_engineering_fees--total_cost":
      "1000",
    "budget_information--other_architectural_engineering_fees--non_allowable_cost":
      "100",

    "budget_information--project_inspection_fees--total_cost": "1000",
    "budget_information--project_inspection_fees--non_allowable_cost": "100",

    "budget_information--site_work--total_cost": "1000",
    "budget_information--site_work--non_allowable_cost": "100",

    "budget_information--demolition_and_removal--total_cost": "1000",
    "budget_information--demolition_and_removal--non_allowable_cost": "100",

    "budget_information--construction--total_cost": "1000",
    "budget_information--construction--non_allowable_cost": "100",

    "budget_information--equipment--total_cost": "1000",
    "budget_information--equipment--non_allowable_cost": "100",

    "budget_information--miscellaneous--total_cost": "1000",
    "budget_information--miscellaneous--non_allowable_cost": "100",

    // -------------------------------------------------------------------------
    // Table 1 - Row 12: Contingencies (user-entered)
    // -------------------------------------------------------------------------

    "budget_information--contingencies--total_cost": "1000",
    "budget_information--contingencies--non_allowable_cost": "100",

    // -------------------------------------------------------------------------
    // Table 1 - Row 14: Project Income (user-entered)
    // -------------------------------------------------------------------------

    "budget_information--project_income--total_cost": "5000",
    "budget_information--project_income--non_allowable_cost": "500",

    // -------------------------------------------------------------------------
    // Table 2: Federal Funding
    // -------------------------------------------------------------------------

    // Use 90% so the expected federal funding share is easy to calculate
    // independently.
    "federal_funding--federal_percentage_share": "90",

    // Keep the suffix available for future expansion if additional
    // environment-specific or applicant-specific values are introduced.
    test_suffix: shortSuffix,
  };
};

/**
 * Opportunity metadata used by load-opportunity-config.ts.
 *
 * This UUID matches the E2E-SF424C opportunity seeded in
 * api/src/task/opportunities/build_automatic_opportunities.py.
 */
export const SF424C_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "a4c8e1f2-3b6d-4e91-8a2c-7f5b9d3e6a18",
  opportunityNumber: "E2E-SF424C-ORG-IND-01",
  formKey: "sf424c",
  expectedPrepopulatedFields: {},
  buildTestData: buildSF424CHappyPathTestData,
};

/** * Expected values for SF-424C Subtotal 1 (Rows 0-10: 11 budget items).
 * Each item: $1,000 total, $100 non-allowable.
 *
 * Subtotal 1:
 *   Total: 11 × $1,000 = $11,000
 *   Non-allowable: 11 × $100 = $1,100
 *   Allowable: $11,000 - $1,100 = $9,900
 */
export const SF424C_SUBTOTAL_1_EXPECTED = {
  total: 11_000,
  nonAllowable: 1_100,
  allowable: 9_900,
} as const;

/**
 * Expected values for SF-424C Subtotal 2 (Rows 0-12: Subtotal 1 + Contingencies).
 * Contingencies: $1,000 total, $100 non-allowable.
 *
 * Subtotal 2:
 *   Total: $11,000 + $1,000 = $12,000
 *   Non-allowable: $1,100 + $100 = $1,200
 *   Allowable: $9,900 + $900 = $10,800
 */
export const SF424C_SUBTOTAL_2_EXPECTED = {
  total: 12_000,
  nonAllowable: 1_200,
  allowable: 10_800,
} as const;

/**
 * Expected values for SF-424C Project Income (Row 14).
 * Total: $5,000, Non-allowable: $500
 *
 * These values are subtracted from Subtotal 2 to calculate Total Project Cost.
 */
export const SF424C_PROJECT_INCOME_EXPECTED = {
  total: 5_000,
  nonAllowable: 500,
  allowable: 4_500,
} as const;

/**
 * Expected values for SF-424C Total Project Cost (Row 15).
 * Calculated as: Subtotal 2 - Project Income
 *
 * Total Project Cost:
 *   Total: $12,000 - $5,000 = $7,000
 *   Non-allowable: $1,200 - $500 = $700
 *   Allowable: $10,800 - $4,500 = $6,300
 */
export const SF424C_TOTAL_PROJECT_COST_EXPECTED = {
  total: 7_000,
  nonAllowable: 700,
  allowable: 6_300,
} as const;

/**
 * Expected values for SF-424C Federal Funding (Table 2).
 *
 * Row 0: Total project costs (read-only, maps to line 16c allowable) = $6,300
 * Row 1: Federal percentage share (user-entered) = 90%
 * Row 2: Federal funding share (read-only, calculated) = $6,300 × 90% = $5,670
 */
export const SF424C_TABLE_2_EXPECTED = {
  totalProjectCosts: 6_300, // Line 16c (allowable)
  federalPercentageShare: 90,
  federalFundingShare: 5_670,
} as const;

/**
 * Map of all calculated fields for SF-424C print view validation.
 * Each entry contains the test ID in print view and the expected value.
 *
 * Calculated fields:
 * - All subtotals (subtotal rows)
 * - Total project cost (row 15)
 * - Table 2 rows (federal funding calculations)
 *
 * Test IDs use the "-read-only" suffix (e.g., budget_424c_table_1-11-1-read-only)
 * which uniquely identifies the field in print view.
 **/
export const SF424C_CALCULATED_FIELDS_MAP = {
  subtotal1_total: {
    testId: "budget_424c_table_1-11-1-read-only",
    value: SF424C_SUBTOTAL_1_EXPECTED.total,
    label: "Subtotal 1 - Total",
  },
  subtotal1_non_allowable: {
    testId: "budget_424c_table_1-11-2-read-only",
    value: SF424C_SUBTOTAL_1_EXPECTED.nonAllowable,
    label: "Subtotal 1 - Non-allowable",
  },
  subtotal1_allowable: {
    testId: "budget_424c_table_1-11-3-read-only",
    value: SF424C_SUBTOTAL_1_EXPECTED.allowable,
    label: "Subtotal 1 - Allowable",
  },
  subtotal2_total: {
    testId: "budget_424c_table_1-13-1-read-only",
    value: SF424C_SUBTOTAL_2_EXPECTED.total,
    label: "Subtotal 2 - Total",
  },
  subtotal2_non_allowable: {
    testId: "budget_424c_table_1-13-2-read-only",
    value: SF424C_SUBTOTAL_2_EXPECTED.nonAllowable,
    label: "Subtotal 2 - Non-allowable",
  },
  subtotal2_allowable: {
    testId: "budget_424c_table_1-13-3-read-only",
    value: SF424C_SUBTOTAL_2_EXPECTED.allowable,
    label: "Subtotal 2 - Allowable",
  },
  total_project_cost: {
    testId: "budget_424c_table_1-15-1-read-only",
    value: SF424C_TOTAL_PROJECT_COST_EXPECTED.total,
    label: "Total Project Cost - Total",
  },
  total_project_cost_non_allowable: {
    testId: "budget_424c_table_1-15-2-read-only",
    value: SF424C_TOTAL_PROJECT_COST_EXPECTED.nonAllowable,
    label: "Total Project Cost - Non-allowable",
  },
  total_project_cost_allowable: {
    testId: "budget_424c_table_1-15-3-read-only",
    value: SF424C_TOTAL_PROJECT_COST_EXPECTED.allowable,
    label: "Total Project Cost - Allowable",
  },
  total_project_costs_table_2: {
    testId: "budget_424c_table_2-0-1-read-only",
    value: SF424C_TABLE_2_EXPECTED.totalProjectCosts,
    label: "Table 2 - Total Project Costs (line 16c)",
  },
  federal_funding_share: {
    testId: "budget_424c_table_2-2-1-read-only",
    value: SF424C_TABLE_2_EXPECTED.federalFundingShare,
    label: "Table 2 - Federal Funding Share",
  },
} as const;

/** * Applicant scenarios for SF-424C print view tests.
 * Includes both Organization and Individual user test cases.
 *
 * @param testOrgLabel - The org label from playwright-env
 * @returns Array of test scenarios with names and org labels
 *
 * @example
 * const applicantScenarios = buildSF424CApplicantScenarios(testOrgLabel);
 * for (const { testName, orgLabel } of applicantScenarios) {
 *   test(testName, async ({ page, context }, testInfo) => {
 *     // test implementation
 *   });
 * }
 */
export function buildSF424CApplicantScenarios(
  testOrgLabel: string | undefined,
): Array<{
  testName: string;
  orgLabel: string | undefined;
}> {
  return [
    {
      testName:
        "Complete the SF-424C Application Submission and Print View workflow for an Organization user",
      orgLabel: testOrgLabel,
    },
    {
      testName:
        "Complete the SF-424C Application Submission and Print View workflow for an Individual user",
      orgLabel: undefined,
    },
  ];
}

// ============================================================================
// SF-424C-Specific Print View Validation Helpers
// ============================================================================
// These helpers are form-specific and centralize validation logic for SF-424C.
// They are used across multiple SF-424C tests (desktop, mobile, etc.)
// and keep specs clean and maintainable.

/**
 * Validates all user-entered Table 1 fields in the SF-424C print view.
 *
 * Checks that each budget item field matches the test data value entered during form fill.
 * Handles flexible currency formatting (e.g., "$1,000", "1000", "$1,000.00").
 *
 * @param page - The Playwright page object
 * @param testData - The test data record from buildHappyPathTestData()
 *
 * @throws if any field is not found, missing a testId, or value doesn't match
 **/
export async function validateSF424CTable1UserEnteredFields(
  page: Page,
  testData: Record<string, string>,
): Promise<void> {
  // Derive field keys from fieldDefinitionsSF424C to prevent drift
  const fieldKeys = Object.keys(SF424C_FORM_CONFIG.fields).filter(
    (fieldKey) => testData[fieldKey] !== undefined,
  );

  for (const fieldKey of fieldKeys) {
    const field = SF424C_FORM_CONFIG.fields[fieldKey];

    if (!field?.testId) {
      throw new Error(`SF-424C field ${fieldKey} does not have a testId.`);
    }

    // In print view, the testId has a "-read-only" suffix
    // e.g., "budget_424c_table_1-0-1-input" becomes "budget_424c_table_1-0-1-read-only"
    const printTestId = field.testId.replace("-input", "-read-only");
    const valuePattern = createFlexibleValuePattern(testData[fieldKey]);

    await expect(page.getByTestId(printTestId)).toContainText(valuePattern);
  }
}

/**
 * Validates all calculated fields in the SF-424C print view.
 *
 * Checks that subtotals, total project cost, and federal funding share calculations
 * match the expected values derived from the fixture test data.
 *
 * Handles flexible currency formatting for numeric values.
 *
 * @param page - The Playwright page object
 *
 * @throws if any calculated field is not found or value doesn't match expected
 *
 * @example
 * await validateSF424CCalculatedFields(page);
 */
export async function validateSF424CCalculatedFields(
  page: Page,
): Promise<void> {
  const fieldEntries = Object.entries(SF424C_CALCULATED_FIELDS_MAP) as Array<
    [
      string,
      {
        testId: string;
        value: number;
      },
    ]
  >;

  for (const [, field] of fieldEntries) {
    const { testId, value } = field;
    const valuePattern = createFlexibleValuePattern(String(value));
    await expect(page.getByTestId(testId).first()).toContainText(valuePattern);
  }
}

/**
 * Validates the federal percentage share field in SF-424C Table 2.
 *
 * Handles special formatting for percentage values (e.g., "90%", "90.00%").
 * The user enters "90" but it displays with percent formatting in print view.
 *
 * @param page - The Playwright page object
 * @param expectedPercentage - The expected percentage value to validate
 *
 * @throws if the field is not found or doesn't match expected percentage format
 *
 * @example
 * // Validates that the field contains "90%" or "90.00%"
 * await validateSF424CFederalPercentageShare(page, 90);
 */
export async function validateSF424CFederalPercentageShare(
  page: Page,
  expectedPercentage: number,
): Promise<void> {
  // Use word boundary \b to prevent matching "90" in "890%" or "190%"
  // Use negative lookahead (?![.\d]) to prevent matching if followed by period or digit
  const percentagePattern = new RegExp(
    `\\b${expectedPercentage}(?:\\.00)?(?![.\\d])%`,
  );
  await expect(
    page.getByTestId("budget_424c_table_2-1-1-read-only").first(),
  ).toContainText(percentagePattern);
}
