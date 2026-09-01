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
  // Row 0: Administrative and Legal Expenses
  "budget_information--administrative_and_legal_expenses--total_cost": {
    testId: "budget_424c_table_1-0-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Total Cost",
  },

  "budget_information--administrative_and_legal_expenses--non_allowable_cost": {
    testId: "budget_424c_table_1-0-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Costs Not Allowable",
  },

  // Row 1: Land, Structures, Rights-of-Way
  "budget_information--land_structures_rights_of_way--total_cost": {
    testId: "budget_424c_table_1-1-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Land, Structures, Rights-of-Way, Appraisals, etc. - Total Cost",
  },

  "budget_information--land_structures_rights_of_way--non_allowable_cost": {
    testId: "budget_424c_table_1-1-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field:
      "Land, Structures, Rights-of-Way, Appraisals, etc. - Costs Not Allowable",
  },

  // Row 2: Relocation Expenses
  "budget_information--relocation_expenses--total_cost": {
    testId: "budget_424c_table_1-2-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Total Cost",
  },

  "budget_information--relocation_expenses--non_allowable_cost": {
    testId: "budget_424c_table_1-2-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Costs Not Allowable",
  },

  // Row 3: Architectural and Engineering Fees
  "budget_information--architectural_engineering_fees--total_cost": {
    testId: "budget_424c_table_1-3-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Total Cost",
  },

  "budget_information--architectural_engineering_fees--non_allowable_cost": {
    testId: "budget_424c_table_1-3-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Costs Not Allowable",
  },

  // Row 4: Other Architectural and Engineering Fees
  "budget_information--other_architectural_engineering_fees--total_cost": {
    testId: "budget_424c_table_1-4-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Other Architectural and Engineering Fees - Total Cost",
  },

  "budget_information--other_architectural_engineering_fees--non_allowable_cost":
    {
      testId: "budget_424c_table_1-4-2-input",
      type: "text",
      maxLength: 14,
      section: "Table 1",
      field: "Other Architectural and Engineering Fees - Costs Not Allowable",
    },

  // Row 5: Project Inspection Fees
  "budget_information--project_inspection_fees--total_cost": {
    testId: "budget_424c_table_1-5-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Total Cost",
  },

  "budget_information--project_inspection_fees--non_allowable_cost": {
    testId: "budget_424c_table_1-5-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Costs Not Allowable",
  },

  // Row 6: Site Work
  "budget_information--site_work--total_cost": {
    testId: "budget_424c_table_1-6-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Total Cost",
  },

  "budget_information--site_work--non_allowable_cost": {
    testId: "budget_424c_table_1-6-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Costs Not Allowable",
  },

  // Row 7: Demolition and Removal
  "budget_information--demolition_and_removal--total_cost": {
    testId: "budget_424c_table_1-7-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Total Cost",
  },

  "budget_information--demolition_and_removal--non_allowable_cost": {
    testId: "budget_424c_table_1-7-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Costs Not Allowable",
  },

  // Row 8: Construction
  "budget_information--construction--total_cost": {
    testId: "budget_424c_table_1-8-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Total Cost",
  },

  "budget_information--construction--non_allowable_cost": {
    testId: "budget_424c_table_1-8-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Costs Not Allowable",
  },

  // Row 9: Equipment
  "budget_information--equipment--total_cost": {
    testId: "budget_424c_table_1-9-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Total Cost",
  },

  "budget_information--equipment--non_allowable_cost": {
    testId: "budget_424c_table_1-9-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Costs Not Allowable",
  },

  // Row 10: Miscellaneous
  "budget_information--miscellaneous--total_cost": {
    testId: "budget_424c_table_1-10-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Total Cost",
  },

  "budget_information--miscellaneous--non_allowable_cost": {
    testId: "budget_424c_table_1-10-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Costs Not Allowable",
  },

  // Row 12: Contingencies
  "budget_information--contingencies--total_cost": {
    testId: "budget_424c_table_1-12-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Total Cost",
  },

  "budget_information--contingencies--non_allowable_cost": {
    testId: "budget_424c_table_1-12-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Costs Not Allowable",
  },

  // Row 14: Project Income
  "budget_information--project_income--total_cost": {
    testId: "budget_424c_table_1-14-1-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Total Cost",
  },

  "budget_information--project_income--non_allowable_cost": {
    testId: "budget_424c_table_1-14-2-input",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Costs Not Allowable",
  },

  // ---------------------------------------------------------------------------
  // Table 2 - Federal Funding
  // ---------------------------------------------------------------------------

  "federal_funding--federal_percentage_share": {
    testId: "budget_424c_table_2-1-1-input",
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
