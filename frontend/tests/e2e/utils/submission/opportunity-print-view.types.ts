import type { FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

// Shape of each form entry in print-view-opportunities.json
export interface PrintViewFormEntry {
  formKey: string;
  /**
   * Values may be exact strings or regex patterns encoded as strings (e.g. "/\\d{2}\\.[A-Z0-9]{3}/i").
   * The loader converts pattern strings to RegExp at load time.
   */
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
  /** String values are exact matches; RegExp values validate format only. */
  expectedPrepopulatedFields: Record<string, string | RegExp>;
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
  /** String values are exact matches; RegExp values validate format only. */
  expectedPrepopulatedFields: Record<string, string | RegExp>;
  userEnteredFieldTestIds: Record<string, string>;
}
