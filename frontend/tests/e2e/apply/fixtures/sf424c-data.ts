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
