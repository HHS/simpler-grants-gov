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

  "administrative_and_legal_expenses--total_cost": {
    testId: "administrative_and_legal_expenses--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Total Cost",
  },

  "administrative_and_legal_expenses--non_allowable_cost": {
    testId: "administrative_and_legal_expenses--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Administrative and Legal Expenses - Costs Not Allowable",
  },

  "land_structures_rights_of_way--total_cost": {
    testId: "land_structures_rights_of_way--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Land, Structures, Rights-of-Way, Appraisals, etc. - Total Cost",
  },

  "land_structures_rights_of_way--non_allowable_cost": {
    testId: "land_structures_rights_of_way--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field:
      "Land, Structures, Rights-of-Way, Appraisals, etc. - Costs Not Allowable",
  },

  "relocation_expenses--total_cost": {
    testId: "relocation_expenses--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Total Cost",
  },

  "relocation_expenses--non_allowable_cost": {
    testId: "relocation_expenses--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Relocation Expenses and Payments - Costs Not Allowable",
  },

  "architectural_engineering_fees--total_cost": {
    testId: "architectural_engineering_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Total Cost",
  },

  "architectural_engineering_fees--non_allowable_cost": {
    testId: "architectural_engineering_fees--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Architectural and Engineering Fees - Costs Not Allowable",
  },

  "other_architectural_engineering_fees--total_cost": {
    testId: "other_architectural_engineering_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Other Architectural and Engineering Fees - Total Cost",
  },

  "other_architectural_engineering_fees--non_allowable_cost": {
    testId: "other_architectural_engineering_fees--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Other Architectural and Engineering Fees - Costs Not Allowable",
  },

  "project_inspection_fees--total_cost": {
    testId: "project_inspection_fees--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Total Cost",
  },

  "project_inspection_fees--non_allowable_cost": {
    testId: "project_inspection_fees--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Inspection Fees - Costs Not Allowable",
  },

  "site_work--total_cost": {
    testId: "site_work--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Total Cost",
  },

  "site_work--non_allowable_cost": {
    testId: "site_work--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Site Work - Costs Not Allowable",
  },

  "demolition_and_removal--total_cost": {
    testId: "demolition_and_removal--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Total Cost",
  },

  "demolition_and_removal--non_allowable_cost": {
    testId: "demolition_and_removal--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Demolition and Removal - Costs Not Allowable",
  },

  "construction--total_cost": {
    testId: "construction--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Total Cost",
  },

  "construction--non_allowable_cost": {
    testId: "construction--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Construction - Costs Not Allowable",
  },

  "equipment--total_cost": {
    testId: "equipment--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Total Cost",
  },

  "equipment--non_allowable_cost": {
    testId: "equipment--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Equipment - Costs Not Allowable",
  },

  "miscellaneous--total_cost": {
    testId: "miscellaneous--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Total Cost",
  },

  "miscellaneous--non_allowable_cost": {
    testId: "miscellaneous--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Miscellaneous - Costs Not Allowable",
  },

  "contingencies--total_cost": {
    testId: "contingencies--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Total Cost",
  },

  "contingencies--non_allowable_cost": {
    testId: "contingencies--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Contingencies - Costs Not Allowable",
  },

  "project_income--total_cost": {
    testId: "project_income--total_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Total Cost",
  },

  "project_income--non_allowable_cost": {
    testId: "project_income--non_allowable_cost",
    type: "text",
    maxLength: 14,
    section: "Table 1",
    field: "Project Income - Costs Not Allowable",
  },

  // ---------------------------------------------------------------------------
  // Table 2 - Federal Funding
  // ---------------------------------------------------------------------------

  federal_percentage_share: {
    testId: "federal_percentage_share",
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
