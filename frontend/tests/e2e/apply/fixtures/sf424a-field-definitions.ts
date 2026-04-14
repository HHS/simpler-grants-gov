import { numberToTwoDecimalString } from "tests/e2e/utils/forms/form-number-utils";
import { type FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

// Uses regex matcher tolerant of hyphen/dash variants for SF-424A,
// to be compatible with both local and staging environments.
export const SF424A_FORM_MATCHER =
  "SF\\s*[-\u2011\u2013\u2014]?\\s*424A|Budget\\s+Information\\s+for\\s+Non\\s*[-\u2011\u2013\u2014]?\\s*Construction\\s+Programs";

// ---------------------------------------------------------------------------
// Expected post-save computed values - derived from FORM_RULE_SCHEMA
// ---------------------------------------------------------------------------

const FILL = 1;
const ROWS = 4;
const QUARTERS = 4;

export const SF424A_EXPECTED = {
  sectionA: {
    // budget_summary.total_amount = sum(C+D+E+F) per row
    rowTotalAmount: numberToTwoDecimalString(4 * FILL),
    // total_budget_summary columns C/D/E/F = ROWS × FILL
    columnCDEF: numberToTwoDecimalString(ROWS * FILL),
    // total_budget_summary.total_amount = sum(activity[*].budget_summary.total_amount)
    columnG: numberToTwoDecimalString(ROWS * 4 * FILL),
  },
  sectionB: {
    // total_budget_categories.{category} = sum across ROWS
    categoryRowSum: numberToTwoDecimalString(ROWS * FILL),
    // total_budget_categories.total_direct_charge_amount = sum across columns
    directChargeColumnSum: numberToTwoDecimalString(ROWS * 8 * FILL),
    // total_budget_categories.total_indirect_charge_amount = sum across columns
    indirectChargeColumnSum: numberToTwoDecimalString(ROWS * FILL),
    // total_budget_categories.total_amount = sum(activity[*].budget_categories.total_amount)
    grandTotal: numberToTwoDecimalString(ROWS * (8 * FILL + FILL)),
    // total_budget_categories.program_income_amount = sum across columns
    programIncomeSum: numberToTwoDecimalString(ROWS * FILL),
  },
  sectionC: {
    // non_federal_resources.total_amount = sum(applicant+state+other) = 3 fields
    rowTotalAmount: numberToTwoDecimalString(3 * FILL),
    // total_non_federal_resources columns B/C/D = ROWS × FILL
    columnBCD: numberToTwoDecimalString(ROWS * FILL),
    // total_non_federal_resources.total_amount = sum(activity[*].non_federal_resources.total_amount)
    grandTotal: numberToTwoDecimalString(ROWS * 3 * FILL),
  },
  sectionD: {
    // federal/non_federal.total_amount = sum(Q1+Q2+Q3+Q4)
    rowTotalAmount: numberToTwoDecimalString(QUARTERS * FILL),
    // total_forecasted_cash_needs.quarter = federal + non_federal per quarter
    quarterColumnSum: numberToTwoDecimalString(2 * FILL),
    // total_forecasted_cash_needs.total_amount = federal.total + non_federal.total
    grandTotal: numberToTwoDecimalString(2 * QUARTERS * FILL),
  },
  sectionE: {
    // total_federal_fund_estimates.{year} = sum across ROWS
    yearColumnSum: numberToTwoDecimalString(ROWS * FILL),
  },
} as const;

/**
 * SF-424A form configuration.
 * Matches the FillFormConfig interface from general-forms-filling.ts
 * Field keys must match the keys in sf424aHappyPathTestData().
 */
export const SF424A_FORM_CONFIG: FillFormConfig = {
  formName: "Budget Information for Non-Construction Programs (SF-424A)",
  saveButtonTestId: "apply-form-save",
  noErrorsText: "No errors were detected",
  fields: {
    // ********* Section A - Budget summary *********
    // Row 1
    "activity_line_items[0]--activity_title": {
      testId: "activity_line_items[0]--activity_title",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[0]--activity_title",
    },
    "activity_line_items[0]--assistance_listing_number": {
      testId: "activity_line_items[0]--assistance_listing_number",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[0]--assistance_listing_number",
    },
    "activity_line_items[0]--budget_summary--federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[0]--budget_summary--federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[0]--budget_summary--federal_estimated_unobligated_amount",
      },
    "activity_line_items[0]--budget_summary--non_federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[0]--budget_summary--non_federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[0]--budget_summary--non_federal_estimated_unobligated_amount",
      },
    "activity_line_items[0]--budget_summary--federal_new_or_revised_amount": {
      testId:
        "activity_line_items[0]--budget_summary--federal_new_or_revised_amount",
      type: "text",
      section: "SectionA",
      field:
        "activity_line_items[0]--budget_summary--federal_new_or_revised_amount",
    },
    "activity_line_items[0]--budget_summary--non_federal_new_or_revised_amount":
      {
        testId:
          "activity_line_items[0]--budget_summary--non_federal_new_or_revised_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[0]--budget_summary--non_federal_new_or_revised_amount",
      },

    // Row 2
    "activity_line_items[1]--activity_title": {
      testId: "activity_line_items[1]--activity_title",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[1]--activity_title",
    },
    "activity_line_items[1]--assistance_listing_number": {
      testId: "activity_line_items[1]--assistance_listing_number",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[1]--assistance_listing_number",
    },
    "activity_line_items[1]--budget_summary--federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[1]--budget_summary--federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[1]--budget_summary--federal_estimated_unobligated_amount",
      },
    "activity_line_items[1]--budget_summary--non_federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[1]--budget_summary--non_federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[1]--budget_summary--non_federal_estimated_unobligated_amount",
      },
    "activity_line_items[1]--budget_summary--federal_new_or_revised_amount": {
      testId:
        "activity_line_items[1]--budget_summary--federal_new_or_revised_amount",
      type: "text",
      section: "SectionA",
      field:
        "activity_line_items[1]--budget_summary--federal_new_or_revised_amount",
    },
    "activity_line_items[1]--budget_summary--non_federal_new_or_revised_amount":
      {
        testId:
          "activity_line_items[1]--budget_summary--non_federal_new_or_revised_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[1]--budget_summary--non_federal_new_or_revised_amount",
      },

    // Row 3
    "activity_line_items[2]--activity_title": {
      testId: "activity_line_items[2]--activity_title",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[2]--activity_title",
    },
    "activity_line_items[2]--assistance_listing_number": {
      testId: "activity_line_items[2]--assistance_listing_number",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[2]--assistance_listing_number",
    },
    "activity_line_items[2]--budget_summary--federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[2]--budget_summary--federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[2]--budget_summary--federal_estimated_unobligated_amount",
      },
    "activity_line_items[2]--budget_summary--non_federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[2]--budget_summary--non_federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[2]--budget_summary--non_federal_estimated_unobligated_amount",
      },
    "activity_line_items[2]--budget_summary--federal_new_or_revised_amount": {
      testId:
        "activity_line_items[2]--budget_summary--federal_new_or_revised_amount",
      type: "text",
      section: "SectionA",
      field:
        "activity_line_items[2]--budget_summary--federal_new_or_revised_amount",
    },
    "activity_line_items[2]--budget_summary--non_federal_new_or_revised_amount":
      {
        testId:
          "activity_line_items[2]--budget_summary--non_federal_new_or_revised_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[2]--budget_summary--non_federal_new_or_revised_amount",
      },

    // Row 4
    "activity_line_items[3]--activity_title": {
      testId: "activity_line_items[3]--activity_title",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[3]--activity_title",
    },
    "activity_line_items[3]--assistance_listing_number": {
      testId: "activity_line_items[3]--assistance_listing_number",
      type: "text",
      section: "SectionA",
      field: "activity_line_items[3]--assistance_listing_number",
    },
    "activity_line_items[3]--budget_summary--federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[3]--budget_summary--federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[3]--budget_summary--federal_estimated_unobligated_amount",
      },
    "activity_line_items[3]--budget_summary--non_federal_estimated_unobligated_amount":
      {
        testId:
          "activity_line_items[3]--budget_summary--non_federal_estimated_unobligated_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[3]--budget_summary--non_federal_estimated_unobligated_amount",
      },
    "activity_line_items[3]--budget_summary--federal_new_or_revised_amount": {
      testId:
        "activity_line_items[3]--budget_summary--federal_new_or_revised_amount",
      type: "text",
      section: "SectionA",
      field:
        "activity_line_items[3]--budget_summary--federal_new_or_revised_amount",
    },
    "activity_line_items[3]--budget_summary--non_federal_new_or_revised_amount":
      {
        testId:
          "activity_line_items[3]--budget_summary--non_federal_new_or_revised_amount",
        type: "text",
        section: "SectionA",
        field:
          "activity_line_items[3]--budget_summary--non_federal_new_or_revised_amount",
      },

    // ********* Section B - Budget categories *********
    // User-editable rows: a–h and j per activity column (i and k are rule-computed)
    ...Object.fromEntries(
      [0, 1, 2, 3].flatMap((i) =>
        [
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
        ].map((field) => {
          const key = `activity_line_items[${i}]--budget_categories--${field}`;
          return [
            key,
            {
              testId: key,
              type: "text" as const,
              section: "SectionB",
              field,
            },
          ];
        }),
      ),
    ),

    // ********* Section C - Non-federal resources *********
    // User-editable: applicant_amount, state_amount, other_amount per row
    // (total_amount is rule-computed)
    ...Object.fromEntries(
      [0, 1, 2, 3].flatMap((i) =>
        ["applicant_amount", "state_amount", "other_amount"].map((field) => {
          const key = `activity_line_items[${i}]--non_federal_resources--${field}`;
          return [
            key,
            {
              testId: key,
              type: "text" as const,
              section: "SectionC",
              field,
            },
          ];
        }),
      ),
    ),

    // ********* Section D - Forecasted cash needs *********
    // User-editable: quarter amounts for federal and non_federal
    // (total_amount and total_forecasted_cash_needs.* are rule-computed)
    ...Object.fromEntries(
      (["federal", "non_federal"] as const).flatMap((type) =>
        [
          "first_quarter_amount",
          "second_quarter_amount",
          "third_quarter_amount",
          "fourth_quarter_amount",
        ].map((field) => {
          const key = `forecasted_cash_needs--${type}_forecasted_cash_needs--${field}`;
          return [
            key,
            {
              testId: key,
              type: "text" as const,
              section: "SectionD",
              field,
            },
          ];
        }),
      ),
    ),

    // ********* Section E - Federal fund estimates *********
    ...[0, 1, 2, 3].reduce<
      Record<
        string,
        { testId: string; type: "text"; section: string; field: string }
      >
    >((acc, i) => {
      for (const field of [
        "first_year_amount",
        "second_year_amount",
        "third_year_amount",
        "fourth_year_amount",
      ]) {
        const key = `activity_line_items[${i}]--federal_fund_estimates--${field}`;
        acc[key] = {
          testId: key,
          type: "text" as const,
          section: "SectionE",
          field,
        };
      }
      return acc;
    }, {}),

    // ********* Section F - Other budget information *********
    // Schema: direct_charges_explanation (maxLength:50),
    //         indirect_charges_explanation (maxLength:50),
    //         remarks (maxLength:250), confirmation (boolean enum:[true])
    direct_charges_explanation: {
      testId: "direct_charges_explanation",
      type: "text",
      section: "SectionF",
      field: "direct_charges_explanation",
    },
    indirect_charges_explanation: {
      testId: "indirect_charges_explanation",
      type: "text",
      section: "SectionF",
      field: "indirect_charges_explanation",
    },
    remarks: {
      testId: "textarea",
      type: "text",
      section: "SectionF",
      field: "remarks",
    },
    confirmation: {
      getByText: "ConfirmationIs this form complete?",
      type: "checkbox",
      section: "SectionF",
      field: "confirmation",
    },
  },
};
