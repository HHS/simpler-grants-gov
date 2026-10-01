import {
  fieldDefinitionsSF424B,
  SF424B_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/sf424b-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { ReadonlyFieldCheck } from "tests/e2e/utils/submission/post-submission-utils";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

// Readonly field checks derived from fill data - fieldIds match testIds in sf424b-field-definitions.ts
export const sf424BReadonlyFields = (
  testData: Record<string, string>,
): ReadonlyFieldCheck[] =>
  Object.entries(testData)
    .map(([dataKey, expectedValue]) => {
      const def =
        fieldDefinitionsSF424B[dataKey as keyof typeof fieldDefinitionsSF424B];
      const fieldId = def?.printTestId ?? def?.testId;
      return fieldId ? { fieldId, expectedValue } : null;
    })
    .filter((check): check is ReadonlyFieldCheck => check !== null);

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

/**
 * Pre-submitted staging application used by the submission ZIP verification
 * spec. SF424B_ZIP_ALL_FIELDS_DATA below describes this application, so keep
 * the two together.
 */
export const SF424B_ZIP_APPLICATION_URL =
  "https://staging.simpler.grants.gov/workspace/applications/aa9da806-3764-4e98-8dd7-8e5a72b20bd8";

/**
 * Fixed test data used specifically for submission ZIP/XML/PDF verification.
 * These values are intentionally stable so the generated GrantApplication.xml
 * and SF424B.pdf can be verified against known values.
 */
export const SF424B_ZIP_ALL_FIELDS_DATA = {
  representative_name: {
    element: "SF424B:RepresentativeName",
    value: "simpler-grants-e2e-tester@navapbc.com",
  },
  title: {
    element: "SF424B:RepresentativeTitle",
    value: "ZIP TEST 001",
  },
  applicant_organization: {
    element: "SF424B:ApplicantOrganizationName",
    value: "ZIP TEST ORG 001",
  },
  SubmittedDate: {
    element: "SF424B:SubmittedDate",
    value: "2026-09-09",
  },
} as const;

/** Entry name of the SF-424B PDF inside the submission zip. */
export const SF424B_ZIP_PDF_NAME = "SF424B.pdf";

/**
 * Text expected in SF424B.pdf for the pre-submitted application above.
 * Labels come from the field definitions; the PDF renders required fields
 * as "<Label>* <value>". Values are matched alone where the PDF shows no label.
 */
export const SF424B_ZIP_PDF_EXPECTED_TEXT: (string | RegExp)[] = [
  SF424B_FORM_MATCHER,
  fieldDefinitionsSF424B.signature.field,
  SF424B_ZIP_ALL_FIELDS_DATA.representative_name.value,
  `${fieldDefinitionsSF424B.title.field}* ${SF424B_ZIP_ALL_FIELDS_DATA.title.value}`,
  `${fieldDefinitionsSF424B.applicant_organization.field}* ${SF424B_ZIP_ALL_FIELDS_DATA.applicant_organization.value}`,
  SF424B_ZIP_ALL_FIELDS_DATA.SubmittedDate.value,
];
