import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const SF424C_FORM_MATCHER =
  /Budget Information for Construction Programs\s*\(SF[--–-]?\s*424C\)/i;

/**
 * Field definitions for SF-424C.
 *
 * Source:
 * - api/src/form_schema/forms/sf424c/1/0/form_json.py
 * - api/src/form_schema/shared/common_shared.py
 *
 * SF-424C is a table-based form:
 * - Table 1: Budget Information for Construction Programs
 * - Table 2: Federal Funding
 *
 * User-entered fields are represented here. Calculated/read-only fields
 * are intentionally excluded from the fill definitions and are validated
 * separately in the print-view spec.
 */
export const fieldDefinitionsSF424C: FormFillFieldDefinitions = {
  // ---------------------------------------------------------------------------
  // Table 1 - Budget Information for Construction Programs
  // ---------------------------------------------------------------------------

  "budget_information--administrative_and_legal_expenses--total_cost": {
    testId: "budget_information--administrative_and_legal_expenses--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Total Cost",
  },

  "budget_information--administrative_and_legal_expenses--non_allowable_cost": {
    testId:
      "budget_information--administrative_and_legal_expenses--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Costs Not Allowable",
  },

  "budget_information--land_structures_rights_of_way--total_cost": {
    testId: "budget_information--land_structures_rights_of_way--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Land, Structures, Rights-of-Way, Appraisals, etc. - Total Cost",
  },

  "budget_information--land_structures_rights_of_way--non_allowable_cost": {
    testId:
      "budget_information--land_structures_rights_of_way--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field:
      "Land, Structures, Rights-of-Way, Appraisals, etc. - Costs Not Allowable",
  },

  "budget_information--relocation_expenses--total_cost": {
    testId: "budget_information--relocation_expenses--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Total Cost",
  },

  "budget_information--relocation_expenses--non_allowable_cost": {
    testId: "budget_information--relocation_expenses--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Costs Not Allowable",
  },

  "budget_information--architectural_engineering_fees--total_cost": {
    testId: "budget_information--architectural_engineering_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Total Cost",
  },

  "budget_information--architectural_engineering_fees--non_allowable_cost": {
    testId:
      "budget_information--architectural_engineering_fees--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Costs Not Allowable",
  },

  "budget_information--other_architectural_engineering_fees--total_cost": {
    testId:
      "budget_information--other_architectural_engineering_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Other Architectural and Engineering Fees - Total Cost",
  },

  "budget_information--other_architectural_engineering_fees--non_allowable_cost":
    {
      testId:
        "budget_information--other_architectural_engineering_fees--non_allowable_cost",
      type: "text",
      maxLength: 14,
      section: "Table 1",
      field: "Other Architectural and Engineering Fees - Costs Not Allowable",
    },

  "budget_information--project_inspection_fees--total_cost": {
    testId: "budget_information--project_inspection_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Total Cost",
  },

  "budget_information--project_inspection_fees--non_allowable_cost": {
    testId: "budget_information--project_inspection_fees--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Costs Not Allowable",
  },

  "budget_information--site_work--total_cost": {
    testId: "budget_information--site_work--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Total Cost",
  },

  "budget_information--site_work--non_allowable_cost": {
    testId: "budget_information--site_work--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Costs Not Allowable",
  },

  "budget_information--demolition_and_removal--total_cost": {
    testId: "budget_information--demolition_and_removal--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Total Cost",
  },

  "budget_information--demolition_and_removal--non_allowable_cost": {
    testId: "budget_information--demolition_and_removal--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Costs Not Allowable",
  },

  "budget_information--construction--total_cost": {
    testId: "budget_information--construction--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Total Cost",
  },

  "budget_information--construction--non_allowable_cost": {
    testId: "budget_information--construction--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Costs Not Allowable",
  },

  "budget_information--equipment--total_cost": {
    testId: "budget_information--equipment--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Total Cost",
  },

  "budget_information--equipment--non_allowable_cost": {
    testId: "budget_information--equipment--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Costs Not Allowable",
  },

  "budget_information--miscellaneous--total_cost": {
    testId: "budget_information--miscellaneous--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Total Cost",
  },

  "budget_information--miscellaneous--non_allowable_cost": {
    testId: "budget_information--miscellaneous--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Costs Not Allowable",
  },

  "budget_information--contingencies--total_cost": {
    testId: "budget_information--contingencies--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Total Cost",
  },

  "budget_information--contingencies--non_allowable_cost": {
    testId: "budget_information--contingencies--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Costs Not Allowable",
  },

  "budget_information--project_income--total_cost": {
    testId: "budget_information--project_income--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Total Cost",
  },

  "budget_information--project_income--non_allowable_cost": {
    testId: "budget_information--project_income--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Costs Not Allowable",
  },

  // ---------------------------------------------------------------------------
  // Table 2 - Federal Funding
  // ---------------------------------------------------------------------------

  "federal_funding--federal_percentage_share": {
    testId: "federal_funding--federal_percentage_share",
    type: "text",
    section: "Table 2",
    field: "Federal Percentage Share",
  },
};

export const SF424C_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Budget Information for Construction Programs (SF-424C)",
  fields: fieldDefinitionsSF424C,
} as const;
