import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  xmlCurrency,
  type SubmissionFieldMap,
} from "tests/e2e/utils/submission/submission-field-utils";

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

// ---------------------------------------------------------------------------
// Submission zip verification (GrantApplication.xml / SF424A.pdf)
// ---------------------------------------------------------------------------

const ACTIVITY_INDEXES = [0, 1, 2, 3] as const;
const QUARTERS = [
  "first_quarter_amount",
  "second_quarter_amount",
  "third_quarter_amount",
  "fourth_quarter_amount",
] as const;
const DIRECT_CHARGE_FIELDS = BUDGET_CATEGORY_FIELDS.filter(
  (field) =>
    field !== "total_indirect_charge_amount" &&
    field !== "program_income_amount",
);

// Field name → XML element (every SF424A element is prefixed "SF424A:").
// The same element names are used for each activity row and for its totals block.
const SUMMARY_XML = {
  federal_estimated_unobligated_amount:
    "BudgetFederalEstimatedUnobligatedAmount",
  non_federal_estimated_unobligated_amount:
    "BudgetNonFederalEstimatedUnobligatedAmount",
  federal_new_or_revised_amount: "BudgetFederalNewOrRevisedAmount",
  non_federal_new_or_revised_amount: "BudgetNonFederalNewOrRevisedAmount",
};
const CATEGORY_XML = {
  personnel_amount: "BudgetPersonnelRequestedAmount",
  fringe_benefits_amount: "BudgetFringeBenefitsRequestedAmount",
  travel_amount: "BudgetTravelRequestedAmount",
  equipment_amount: "BudgetEquipmentRequestedAmount",
  supplies_amount: "BudgetSuppliesRequestedAmount",
  contractual_amount: "BudgetContractualRequestedAmount",
  construction_amount: "BudgetConstructionRequestedAmount",
  other_amount: "BudgetOtherRequestedAmount",
  total_direct_charge_amount: "BudgetTotalDirectChargesAmount", // rule-computed
  total_indirect_charge_amount: "BudgetIndirectChargesAmount",
  total_amount: "BudgetTotalAmount", // rule-computed
  program_income_amount: "ProgramIncomeAmount",
};
const NON_FEDERAL_XML = {
  applicant_amount: "BudgetApplicantContributionAmount",
  state_amount: "BudgetStateContributionAmount",
  other_amount: "BudgetOtherContributionAmount",
  total_amount: "BudgetTotalContributionAmount", // rule-computed
};
const FEDERAL_FUNDS_XML = {
  first_year_amount: "BudgetFirstYearAmount",
  second_year_amount: "BudgetSecondYearAmount",
  third_year_amount: "BudgetThirdYearAmount",
  fourth_year_amount: "BudgetFourthYearAmount",
};

const currencyField = (element: string) => ({
  xmlElement: `SF424A:${element}`,
  xmlTransform: xmlCurrency,
});

/**
 * submissionFields for the SF-424A zip spec. Keys are the fill-data keys, plus the
 * rule-computed totals (values from sf424aComputedValues, supplied by the spec).
 */
const buildSF424ASubmissionFields = (): SubmissionFieldMap => {
  const fields: SubmissionFieldMap = {};

  for (const i of ACTIVITY_INDEXES) {
    const row = `activity_line_items[${i}]`;
    // activityTitle is an XML attribute, so it is only verified in the PDF.
    fields[`${row}--activity_title`] = { verifyInPdf: true };
    fields[`${row}--assistance_listing_number`] = {
      xmlElement: "SF424A:CFDANumber",
    };
    for (const [field, element] of Object.entries(SUMMARY_XML)) {
      fields[`${row}--budget_summary--${field}`] = currencyField(element);
    }
    for (const [field, element] of Object.entries(CATEGORY_XML)) {
      fields[`${row}--budget_categories--${field}`] = currencyField(element);
    }
    for (const [field, element] of Object.entries(NON_FEDERAL_XML)) {
      fields[`${row}--non_federal_resources--${field}`] =
        currencyField(element);
    }
    for (const [field, element] of Object.entries(FEDERAL_FUNDS_XML)) {
      fields[`${row}--federal_fund_estimates--${field}`] =
        currencyField(element);
    }
  }

  // Column totals (all rule-computed)
  const totals = [
    ["total_budget_summary", SUMMARY_XML],
    ["total_budget_categories", CATEGORY_XML],
    ["total_non_federal_resources", NON_FEDERAL_XML],
    ["total_federal_fund_estimates", FEDERAL_FUNDS_XML],
  ] as const;
  for (const [section, elements] of totals) {
    for (const [field, element] of Object.entries(elements)) {
      fields[`${section}--${field}`] = currencyField(element);
    }
  }

  // Section D - forecasted cash needs
  for (const quarter of QUARTERS) {
    fields[`forecasted_cash_needs--federal_forecasted_cash_needs--${quarter}`] =
      currencyField("BudgetFederalForecastedAmount");
    fields[
      `forecasted_cash_needs--non_federal_forecasted_cash_needs--${quarter}`
    ] = currencyField("BudgetNonFederalForecastedAmount");
    fields[`forecasted_cash_needs--total_forecasted_cash_needs--${quarter}`] =
      currencyField("BudgetTotalForecastedAmount");
  }
  fields["forecasted_cash_needs--federal_forecasted_cash_needs--total_amount"] =
    currencyField("BudgetFederalForecastedAmount");
  fields[
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--total_amount"
  ] = currencyField("BudgetNonFederalForecastedAmount");
  fields["forecasted_cash_needs--total_forecasted_cash_needs--total_amount"] =
    currencyField("BudgetTotalForecastedAmount");

  // Section F - other information
  fields.direct_charges_explanation = {
    xmlElement: "SF424A:OtherDirectChargesExplanation",
    verifyInPdf: true,
  };
  fields.indirect_charges_explanation = {
    xmlElement: "SF424A:OtherIndirectChargesExplanation",
    verifyInPdf: true,
  };
  fields.remarks = { xmlElement: "SF424A:Remarks", verifyInPdf: true };

  return fields;
};

const sum = (values: (string | undefined)[]): number =>
  values.reduce((total, value) => total + Number(value ?? 0), 0);

/**
 * Values the system computes (sum_monetary rules) from the user-entered test data:
 * per-row totals, column totals and forecast totals. Keyed like submissionFields and
 * unformatted (the xmlCurrency transform adds the decimals). Pass as systemValues.
 */
export const sf424aComputedValues = (
  testData: Record<string, string>,
): Record<string, string> => {
  const computed: Record<string, string> = {};
  const entered = (i: number, section: string, field: string) =>
    testData[`activity_line_items[${i}]--${section}--${field}`];
  const columnSum = (section: string, field: string) =>
    sum(ACTIVITY_INDEXES.map((i) => entered(i, section, field)));

  // Per-row totals
  const rowDirect: Record<number, number> = {};
  for (const i of ACTIVITY_INDEXES) {
    const row = `activity_line_items[${i}]`;
    rowDirect[i] = sum(
      DIRECT_CHARGE_FIELDS.map((f) => entered(i, "budget_categories", f)),
    );
    const rowTotal =
      rowDirect[i] +
      Number(entered(i, "budget_categories", "total_indirect_charge_amount"));
    computed[`${row}--budget_categories--total_direct_charge_amount`] = String(
      rowDirect[i],
    );
    computed[`${row}--budget_categories--total_amount`] = String(rowTotal);
    computed[`${row}--non_federal_resources--total_amount`] = String(
      sum(
        ["applicant_amount", "state_amount", "other_amount"].map((f) =>
          entered(i, "non_federal_resources", f),
        ),
      ),
    );
  }

  // Column totals
  for (const field of Object.keys(SUMMARY_XML)) {
    computed[`total_budget_summary--${field}`] = String(
      columnSum("budget_summary", field),
    );
  }
  for (const field of Object.keys(CATEGORY_XML)) {
    const isComputedRow =
      field === "total_direct_charge_amount" || field === "total_amount";
    computed[`total_budget_categories--${field}`] = String(
      isComputedRow
        ? sum(
            ACTIVITY_INDEXES.map(
              (i) =>
                computed[
                  `activity_line_items[${i}]--budget_categories--${field}`
                ],
            ),
          )
        : columnSum("budget_categories", field),
    );
  }
  for (const field of Object.keys(NON_FEDERAL_XML)) {
    computed[`total_non_federal_resources--${field}`] = String(
      field === "total_amount"
        ? sum(
            ACTIVITY_INDEXES.map(
              (i) =>
                computed[
                  `activity_line_items[${i}]--non_federal_resources--total_amount`
                ],
            ),
          )
        : columnSum("non_federal_resources", field),
    );
  }
  for (const field of Object.keys(FEDERAL_FUNDS_XML)) {
    computed[`total_federal_fund_estimates--${field}`] = String(
      columnSum("federal_fund_estimates", field),
    );
  }

  // Forecasted cash needs
  const forecast = (type: string, quarter: string) =>
    testData[
      `forecasted_cash_needs--${type}_forecasted_cash_needs--${quarter}`
    ];
  const federalTotal = sum(QUARTERS.map((q) => forecast("federal", q)));
  const nonFederalTotal = sum(QUARTERS.map((q) => forecast("non_federal", q)));
  computed[
    "forecasted_cash_needs--federal_forecasted_cash_needs--total_amount"
  ] = String(federalTotal);
  computed[
    "forecasted_cash_needs--non_federal_forecasted_cash_needs--total_amount"
  ] = String(nonFederalTotal);
  computed["forecasted_cash_needs--total_forecasted_cash_needs--total_amount"] =
    String(federalTotal + nonFederalTotal);
  for (const quarter of QUARTERS) {
    computed[`forecasted_cash_needs--total_forecasted_cash_needs--${quarter}`] =
      String(
        sum([forecast("federal", quarter), forecast("non_federal", quarter)]),
      );
  }

  return computed;
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
  // What the submission zip spec verifies per field (XML element and/or PDF text).
  // Rule-computed totals are not in the fill data; the spec supplies them via sf424aComputedValues.
  submissionFields: buildSF424ASubmissionFields(),
};
