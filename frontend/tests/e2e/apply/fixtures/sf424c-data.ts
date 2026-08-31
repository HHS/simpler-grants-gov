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
    // Table 1 - Rows 1-11
    // -------------------------------------------------------------------------

    "administrative_and_legal_expenses--total_cost": "1000",
    "administrative_and_legal_expenses--non_allowable_cost": "100",

    "land_structures_rights_of_way--total_cost": "2000",
    "land_structures_rights_of_way--non_allowable_cost": "200",

    "relocation_expenses--total_cost": "3000",
    "relocation_expenses--non_allowable_cost": "300",

    "architectural_engineering_fees--total_cost": "4000",
    "architectural_engineering_fees--non_allowable_cost": "400",

    "other_architectural_engineering_fees--total_cost": "5000",
    "other_architectural_engineering_fees--non_allowable_cost": "500",

    "project_inspection_fees--total_cost": "6000",
    "project_inspection_fees--non_allowable_cost": "600",

    "site_work--total_cost": "7000",
    "site_work--non_allowable_cost": "700",

    "demolition_and_removal--total_cost": "8000",
    "demolition_and_removal--non_allowable_cost": "800",

    "construction--total_cost": "9000",
    "construction--non_allowable_cost": "900",

    "equipment--total_cost": "10000",
    "equipment--non_allowable_cost": "1000",

    "miscellaneous--total_cost": "11000",
    "miscellaneous--non_allowable_cost": "1100",

    // -------------------------------------------------------------------------
    // Table 1 - Row 13
    // -------------------------------------------------------------------------

    "contingencies--total_cost": "12000",
    "contingencies--non_allowable_cost": "1200",

    // -------------------------------------------------------------------------
    // Table 1 - Row 15
    // -------------------------------------------------------------------------

    "project_income--total_cost": "1000",
    "project_income--non_allowable_cost": "100",

    // -------------------------------------------------------------------------
    // Table 2
    // -------------------------------------------------------------------------

    // Use a simple percentage so the expected federal funding share is easy
    // to calculate independently.
    federal_percentage_share: "50",

    // Keep the suffix available for future expansion if additional
    // environment-specific or applicant-specific values are introduced.
    test_suffix: shortSuffix,
  };
};

/**
 * Opportunity metadata used by load-opportunity-config.ts.
 *
 * Replace the UUID below with the UUID of the actual SF-424C E2E opportunity
 * if the opportunity has already been created in the test environment.
 */
export const SF424C_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "REPLACE-WITH-SF424C-OPPORTUNITY-UUID",
  opportunityNumber: "E2E-SF424C-ORG-IND-01",
  formKey: "sf424c",
  expectedPrepopulatedFields: {},
  buildTestData: buildSF424CHappyPathTestData,
};
