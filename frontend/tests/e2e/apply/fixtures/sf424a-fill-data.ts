/**
 * Test data for SF-424A happy path.
 *
 * Keys must match exactly the field keys defined in SF424A_FORM_CONFIG.fields
 * in sf424a-field-definitions.ts — the generic fillForm() engine uses these
 * keys to look up which value to fill into which field.
 *
 * All numeric fields are set to "1" so computed totals are fully deterministic
 * and match SF424A_EXPECTED in sf424a-field-definitions.ts.
 */

const FILL = "1";
const CFDA = "00.000";

const ACTIVITY_TITLES = [
  "TEST GPF 001",
  "TEST GPF 002",
  "TEST GPF 003",
  "TEST GPF 004",
] as const;

export function sf424aHappyPathTestData(): Record<string, string> {
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
  const budgetCategoryFields = [
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

  [0, 1, 2, 3].forEach((i) => {
    budgetCategoryFields.forEach((field) => {
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
  // Note: confirmation checkbox is handled separately — fillForm() does not
  // support boolean fields. The generic engine will need extending or the
  // checkbox click needs adding to general-forms-filling.ts if other forms
  // also have confirmation checkboxes.

  return data;
}
