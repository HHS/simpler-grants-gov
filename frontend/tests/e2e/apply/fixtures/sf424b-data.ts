import type { fieldDefinitionsSF424B } from "tests/e2e/apply/fixtures/sf424b-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { ReadonlyFieldCheck } from "tests/e2e/utils/submission/post-submission-utils";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

export const sf424BHappyPathTestData = (
  orgLabel: string,
): Record<string, string> => ({
  title: "TESTER",
  organization: orgLabel,
});

// Readonly field checks derived from fill data - fieldIds match testIds in sf424b-field-definitions.ts
export const sf424BReadonlyFields = (
  orgLabel: string,
): ReadonlyFieldCheck[] => [
  { fieldId: "title", expectedValue: sf424BHappyPathTestData(orgLabel).title },
  {
    fieldId: "applicant_organization",
    expectedValue: sf424BHappyPathTestData(orgLabel).organization,
  },
];

/**
 * Happy-path test data builder for the SF-424B form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * signature and date_signed are excluded here since they're system
 * post-populated at submission time, not user-entered.
 */
export const buildSF424BHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    title: `Title ${shortSuffix}`,
    applicant_organization: `Org ${shortSuffix}`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsSF424B, string>>;
};

/**
 * Contains opportunity metadata and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const SF424B_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "dbd8b2c4-0d6b-48b6-9427-32ee7795f4d6",
  opportunityNumber: "E2E-SF424B-ORG-IND-01",
  formKey: "sf424b",
  // No opportunity-derived prepopulated fields in form_json.py
  expectedPrepopulatedFields: {},
  buildTestData: buildSF424BHappyPathTestData,
};
