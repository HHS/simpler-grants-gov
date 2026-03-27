/**
 * Test data for SF-424A happy path.
 *
 * Keys must match exactly the field keys defined in SF424A_FORM_CONFIG.fields
 * in sf424a-field-definitions.ts - the generic fillForm() engine uses these
 * keys to look up which value to fill into which field.
 *
 * All numeric fields are set to "1" so computed totals are fully deterministic
 * and match SF424A_EXPECTED in sf424a-field-definitions.ts.
 */

const FILL = "1";
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
    data[`activity_line_items[${i}]--activity_title`] = title;
    data[`activity_line_items[${i}]--assistance_listing_number`] = CFDA;
    data[
      `activity_line_items[${i}]--budget_summary--federal_estimated_unobligated_amount`
    ] = FILL;
    data[
      `activity_line_items[${i}]--budget_summary--non_federal_estimated_unobligated_amount`
    ] = FILL;
    data[
      `activity_line_items[${i}]--budget_summary--federal_new_or_revised_amount`
    ] = FILL;
    data[
      `activity_line_items[${i}]--budget_summary--non_federal_new_or_revised_amount`
    ] = FILL;
  });

  // ********* Section B - Budget categories *********
  // Fills user-editable rows a–h and j per activity column
  // Rows i (total_direct_charge_amount) and k (total_amount) are rule-computed
  [0, 1, 2, 3].forEach((i) => {
    BUDGET_CATEGORY_FIELDS.forEach((field) => {
      data[`activity_line_items[${i}]--budget_categories--${field}`] = FILL;
    });
  });

  // ********* Section C - Non-federal resources *********
  // Fills applicant_amount, state_amount, other_amount per row
  // total_amount is rule-computed
  [0, 1, 2, 3].forEach((i) => {
    data[`activity_line_items[${i}]--non_federal_resources--applicant_amount`] =
      FILL;
    data[`activity_line_items[${i}]--non_federal_resources--state_amount`] =
      FILL;
    data[`activity_line_items[${i}]--non_federal_resources--other_amount`] =
      FILL;
  });

  // ********* Section D - Forecasted cash needs *********
  // Fills quarter amounts for federal and non_federal
  // total_amount and total_forecasted_cash_needs.* are rule-computed
  (["federal", "non_federal"] as const).forEach((type) => {
    [
      "first_quarter_amount",
      "second_quarter_amount",
      "third_quarter_amount",
      "fourth_quarter_amount",
    ].forEach((field) => {
      data[`forecasted_cash_needs--${type}_forecasted_cash_needs--${field}`] =
        FILL;
    });
  });

  // ********* Section E - Federal fund estimates *********
  [0, 1, 2, 3].forEach((i) => {
    [
      "first_year_amount",
      "second_year_amount",
      "third_year_amount",
      "fourth_year_amount",
    ].forEach((field) => {
      data[`activity_line_items[${i}]--federal_fund_estimates--${field}`] =
        FILL;
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
 * Pre-computed singleton for the default SF-424A happy path data.
 * Use this when no overrides are needed to avoid re-computing on each call.
 */
export const SF424A_HAPPY_PATH_DATA: Record<string, string> =
  sf424aHappyPathTestData();
