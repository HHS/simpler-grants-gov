import type { FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

/**
 * Per-form print view configuration, exported from each form's data file.
 * Contains all opportunity metadata and expected prepopulated field values
 * so that all form-specific data lives in one place.
 *
 * Add one of these exports to the form's fill-data file when introducing a new
 * print-view-testable form, then register it in load-opportunity-config.ts.
 */
export interface PrintViewFormData {
  opportunityId: string;
  opportunityNumber: string;
  formKey: string;
  /** Values may be exact strings or RegExp for format-only validation. */
  expectedPrepopulatedFields: Record<string, string | RegExp>;
}

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
