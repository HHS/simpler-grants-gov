import {
  buildValidationConfig,
  FieldConfigOverrides,
} from "tests/e2e/utils/field-validation/utils/build-validation-config";
import { SF424A_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424a-field-definitions";

/**
 * Overrides for the SF-424A field validation config.
 *
 * SF-424A is almost entirely composed of `budget_monetary_amount` string fields
 * (pattern: ^(-)?d*([.]d{2})?$, maxLength: 14) repeated across 4 activity rows.
 * The overrides are generated programmatically to avoid ~90 near-identical entries.
 *
 * Fields automatically excluded by buildValidationConfig (non-text types):
 *   - confirmation  → checkbox
 *
 * Fields that need overrides:
 *   - All monetary amount inputs → validationMode "inline-error" + pattern
 *     (these are string inputs on the DOM, not number inputs, so the pattern
 *      validator fires rather than the numeric range validator)
 *
 * Fields with no overrides needed (plain text, auto-detected from DOM):
 *   - activity_title               (maxLength: 120, truncate)
 *   - assistance_listing_number    (maxLength: 15,  truncate)
 *   - direct_charges_explanation   (maxLength: 50,  truncate)
 *   - indirect_charges_explanation (maxLength: 50,  truncate)
 *   - remarks                      (maxLength: 250, truncate)
 */

const MONEY = /^(-)?(\d+)([.]\d{2})?$/;

/** Produces FieldConfigOverrides entries for a list of monetary field keys. */
function monetaryOverrides(keys: string[]): FieldConfigOverrides {
  return Object.fromEntries(
    keys.map((key) => [
      key,
      { validationMode: "inline-error" as const, pattern: MONEY },
    ]),
  );
}

/** Returns all monetary field keys for one activity row (used in A, B, C, E). */
function activityMonetaryKeys(i: number): string[] {
  return [
    // Section A — Budget Summary columns C–F (column G "total_amount" is rule-computed)
    `activity_line_items[${i}]--budget_summary--federal_estimated_unobligated_amount`,
    `activity_line_items[${i}]--budget_summary--non_federal_estimated_unobligated_amount`,
    `activity_line_items[${i}]--budget_summary--federal_new_or_revised_amount`,
    `activity_line_items[${i}]--budget_summary--non_federal_new_or_revised_amount`,

    // Section B — Budget Categories rows A–H, J (rows I and K are rule-computed)
    `activity_line_items[${i}]--budget_categories--personnel_amount`,
    `activity_line_items[${i}]--budget_categories--fringe_benefits_amount`,
    `activity_line_items[${i}]--budget_categories--travel_amount`,
    `activity_line_items[${i}]--budget_categories--equipment_amount`,
    `activity_line_items[${i}]--budget_categories--supplies_amount`,
    `activity_line_items[${i}]--budget_categories--contractual_amount`,
    `activity_line_items[${i}]--budget_categories--construction_amount`,
    `activity_line_items[${i}]--budget_categories--other_amount`,
    `activity_line_items[${i}]--budget_categories--total_indirect_charge_amount`,
    `activity_line_items[${i}]--budget_categories--program_income_amount`,

    // Section C — Non-Federal Resources columns B–D (column E "total_amount" is rule-computed)
    `activity_line_items[${i}]--non_federal_resources--applicant_amount`,
    `activity_line_items[${i}]--non_federal_resources--state_amount`,
    `activity_line_items[${i}]--non_federal_resources--other_amount`,

    // Section E — Federal Fund Estimates columns B–E
    `activity_line_items[${i}]--federal_fund_estimates--first_year_amount`,
    `activity_line_items[${i}]--federal_fund_estimates--second_year_amount`,
    `activity_line_items[${i}]--federal_fund_estimates--third_year_amount`,
    `activity_line_items[${i}]--federal_fund_estimates--fourth_year_amount`,
  ];
}

const SF424A_OVERRIDES: FieldConfigOverrides = {
  ...monetaryOverrides([
    // Section D — Forecasted Cash Needs (federal and non-federal quarter amounts)
    // total_amount and total_forecasted_cash_needs.* are rule-computed, not in field defs
    "forecasted_cash_needs--federal_forecasted_cash_needs--first_quarter_amount",
    "forecasted_cash_needs--federal_forecasted_cash_needs--second_quarter_amount",
    "forecasted_cash_needs--federal_forecasted_cash_needs--third_quarter_amount",
    "forecasted_cash_needs--federal_forecasted_cash_needs--fourth_quarter_amount",
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--first_quarter_amount",
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--second_quarter_amount",
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--third_quarter_amount",
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--fourth_quarter_amount",

    // Activity rows 0–3 (Sections A, B, C, E)
    ...[0, 1, 2, 3].flatMap((i) => activityMonetaryKeys(i)),
  ]),
};

export const SF424A_VALIDATION_CONFIG = buildValidationConfig(
  SF424A_FORM_CONFIG.fields,
  SF424A_OVERRIDES,
);
