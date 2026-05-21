import type { FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

// Shape of each form entry in print-view-opportunities.json
export interface PrintViewFormEntry {
  formKey: string;
  expectedPrepopulatedFields: Record<string, string>;
}

// Shape of each opportunity entry in print-view-opportunities.json
export interface PrintViewOpportunityEntry {
  opportunityId: string;
  forms: PrintViewFormEntry[];
}

// The full registry: opportunityNumber → opportunity entry
export type PrintViewOpportunityRegistry = Record<
  string,
  PrintViewOpportunityEntry
>;

// Resolved form returned by the loader after mapping formKey → FillFormConfig
export interface ResolvedPrintViewForm {
  formKey: string;
  formConfig: FillFormConfig;
  expectedPrepopulatedFields: Record<string, string>;
  /**
   * Maps fill-data key → print view testId.
   * Derived from formConfig.fields using printTestId ?? testId.
   * Only includes fields that have at least one testId defined.
   */
  userEnteredFieldTestIds: Record<string, string>;
}

// Resolved opportunity config returned by loadOpportunityConfig()
export interface ResolvedPrintViewOpportunityConfig {
  opportunityId: string;
  opportunityNumber: string;
  opportunityUrl: string;
  forms: ResolvedPrintViewForm[];
}

// Shape of each entry collected during the form-filling loop in the spec
export interface FilledFormEntry {
  formKey: string;
  formName: string | RegExp;
  testData: Record<string, string>;
  printUrl: string;
  expectedPrepopulatedFields: Record<string, string>;
  userEnteredFieldTestIds: Record<string, string>;
}
