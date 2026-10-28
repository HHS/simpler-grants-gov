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

/** Entry name of the SF-424B PDF inside the submission zip. */
export const SF424B_ZIP_PDF_NAME = "SF424B.pdf";

/**
 * Value the system post-populates into the SF-424B signature
 * (SF424B:RepresentativeName) at submission: the e2e user's email.
 */
export const SF424B_ZIP_SIGNATURE_VALUE =
  "simpler-grants-e2e-tester@navapbc.com";

/**
 * Submission date as it appears in the zip (YYYY-MM-DD). Uses UTC because the
 * date is generated server-side. Call right after submission.
 */
export const getSubmittedDateUtc = (): string =>
  new Date().toISOString().slice(0, 10);

/**
 * Expected GrantApplication.xml elements for a run of the end-to-end flow.
 * user-entered values come from the testData that was filled into the form.
 */
export const buildSF424BZipXmlFields = (
  testData: Record<string, string>,
  submittedDate: string,
): Record<string, { element: string; value: string }> => ({
  representative_name: {
    element: "SF424B:RepresentativeName",
    value: SF424B_ZIP_SIGNATURE_VALUE,
  },
  title: {
    element: "SF424B:RepresentativeTitle",
    value: testData.title,
  },
  applicant_organization: {
    element: "SF424B:ApplicantOrganizationName",
    value: testData.applicant_organization,
  },
  SubmittedDate: {
    element: "SF424B:SubmittedDate",
    value: submittedDate,
  },
});

/**
 * Text expected in SF424B.pdf for a run of the end-to-end flow.
 * Labels come from the field definitions; the PDF renders required fields
 * as "<Label>* <value>". Values are matched alone where the PDF shows no label.
 */
export const buildSF424BZipPdfExpectedText = (
  testData: Record<string, string>,
  submittedDate: string,
): (string | RegExp)[] => [
  SF424B_FORM_MATCHER,
  fieldDefinitionsSF424B.signature.field,
  SF424B_ZIP_SIGNATURE_VALUE,
  `${fieldDefinitionsSF424B.title.field}* ${testData.title}`,
  `${fieldDefinitionsSF424B.applicant_organization.field}* ${testData.applicant_organization}`,
  submittedDate,
];
