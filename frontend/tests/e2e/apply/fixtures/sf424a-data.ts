import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

/**
 * Test data for SF-424A happy path.
 *
 * Keys must match exactly the field keys defined in SF424A_FORM_CONFIG.fields
 * in sf424a-field-definitions.ts - the generic fillForm() engine uses these
 * keys to look up which value to fill into which field.
 *
 * Uses unique values per activity (01, 02, 03, 04) to test data entry and
 * calculation with diverse inputs. Totals remain deterministic based on
 * activity index, enabling reliable value assertions.
 */

// Helper to get activity-specific FILL value (activity 0 uses "01", activity 1 uses "02", etc.)
const getFillValue = (activityIndex: number): string =>
  (activityIndex + 1).toString().padStart(2, "0");
const CFDA = "00.000";

const BUDGET_CATEGORY_FIELDS = [
  "personnel_amount",
  "fringe_benefits_amount",
  "travel_amount",
  "equipment_amount",
  "supplies_amount",
  "contractual_amount",
  "construction_amount",
  "other_amount",
  "total_indirect_charge_amount",
  "program_income_amount",
];

const ACTIVITY_TITLES = [
  "TEST GPF 001",
  "TEST GPF 002",
  "TEST GPF 003",
  "TEST GPF 004",
] as const;

/**
 * Pre-computed test data for SF-424A happy path.
 * All numeric fields are "1" so computed totals match SF424A_EXPECTED.
 * Pass `overrides` to selectively change fields for error-case tests.
 */
export function sf424aHappyPathTestData(
  overrides?: Partial<Record<string, string>>,
): Record<string, string> {
  const data: Record<string, string> = {};

  // ********* Section A - Budget summary *********
  ACTIVITY_TITLES.forEach((title, i) => {
    const activityValue = getFillValue(i);
    data[`activity_line_items[${i}]--activity_title`] = title;
    data[`activity_line_items[${i}]--assistance_listing_number`] = CFDA;
    data[
      `activity_line_items[${i}]--budget_summary--federal_estimated_unobligated_amount`
    ] = activityValue;
    data[
      `activity_line_items[${i}]--budget_summary--non_federal_estimated_unobligated_amount`
    ] = activityValue;
    data[
      `activity_line_items[${i}]--budget_summary--federal_new_or_revised_amount`
    ] = activityValue;
    data[
      `activity_line_items[${i}]--budget_summary--non_federal_new_or_revised_amount`
    ] = activityValue;
  });

  // ********* Section B - Budget categories *********
  // Fills user-editable rows a–h and j per activity column
  // Rows i (total_direct_charge_amount) and k (total_amount) are rule-computed
  [0, 1, 2, 3].forEach((i) => {
    const activityValue = getFillValue(i);
    BUDGET_CATEGORY_FIELDS.forEach((field) => {
      data[`activity_line_items[${i}]--budget_categories--${field}`] =
        activityValue;
    });
  });

  // ********* Section C - Non-federal resources *********
  // Fills applicant_amount, state_amount, other_amount per row
  // total_amount is rule-computed
  [0, 1, 2, 3].forEach((i) => {
    const activityValue = getFillValue(i);
    data[`activity_line_items[${i}]--non_federal_resources--applicant_amount`] =
      activityValue;
    data[`activity_line_items[${i}]--non_federal_resources--state_amount`] =
      activityValue;
    data[`activity_line_items[${i}]--non_federal_resources--other_amount`] =
      activityValue;
  });

  // ********* Section D - Forecasted cash needs *********
  // Fills quarter amounts for federal and non_federal
  // total_amount and total_forecasted_cash_needs.* are rule-computed
  // Use "01" for all quarters to keep this section consistent
  const forecasterFill = "01";
  (["federal", "non_federal"] as const).forEach((type) => {
    [
      "first_quarter_amount",
      "second_quarter_amount",
      "third_quarter_amount",
      "fourth_quarter_amount",
    ].forEach((field) => {
      data[`forecasted_cash_needs--${type}_forecasted_cash_needs--${field}`] =
        forecasterFill;
    });
  });

  // ********* Section E - Federal fund estimates *********
  [0, 1, 2, 3].forEach((i) => {
    const activityValue = getFillValue(i);
    [
      "first_year_amount",
      "second_year_amount",
      "third_year_amount",
      "fourth_year_amount",
    ].forEach((field) => {
      data[`activity_line_items[${i}]--federal_fund_estimates--${field}`] =
        activityValue;
    });
  });

  // ********* Section F - Other budget information *********
  data.direct_charges_explanation = "TEST DIRECT CHARGES";
  data.indirect_charges_explanation = "TEST INDIRECT CHARGES";
  data.remarks = "TEST REMARKS";
  // confirmation checkbox - handled via the checkbox field type in SF424A_FORM_CONFIG
  data.confirmation = "true";

  return overrides
    ? {
        ...data,
        ...(Object.fromEntries(
          Object.entries(overrides).filter(([, v]) => v !== undefined),
        ) as Record<string, string>),
      }
    : data;
}

/**
 * Happy-path test data builder for the SF-424A form.
 * The suffix parameter is reserved for future differentiation but not currently used.
 */
export const buildSF424aHappyPathTestData = (
  _suffix: number,
): Record<string, string> => {
  return sf424aHappyPathTestData();
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 *
 * Note: SF-424A is a budget form with no prepopulated opportunity metadata fields(unlike SF-424 which displays funding_opportunity_number, agency_name, etc.).
 */
export const SF424A_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "6c25cd41-660e-473f-abff-654083b7795d",
  opportunityNumber: "E2E-SF424A-ORG-IND-01",
  formKey: "sf424a",
  expectedPrepopulatedFields: {},
  buildTestData: buildSF424aHappyPathTestData,
};
