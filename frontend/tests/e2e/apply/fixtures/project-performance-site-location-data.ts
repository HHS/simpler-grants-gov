import path from "path";
import type { PPSL_FORM_CONFIG } from "tests/e2e/apply/fixtures/project-performance-site-location-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

// Uploaded files validated by section locator in print view.
const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");
const PPSL_TEST_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

/**
 * Happy-path test data builder for the PROJECT/PERFORMANCE SITE LOCATION(S) form.
 * Fills the primary site only; additional sites array is skipped.
 * submitting_as_individual is set to "false" so organization_name is required and filled.
 * congressional_district is required when country is USA and is exactly 6 characters.
 * additional_locations_attachment is optional and included to exercise the file upload path.
 */
export const buildPPSLHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Primary Site – Submission type
    "primary_site--submitting_as_individual": "false",
    // Primary Site – Organization
    "primary_site--organization_name": `Org ${shortSuffix}`,
    // Primary Site – Address
    "primary_site--address--street1": `${shortSuffix} Main St`,
    "primary_site--address--street2": `Suite ${shortSuffix}`,
    "primary_site--address--city": `City ${shortSuffix}`,
    "primary_site--address--county": `County ${shortSuffix}`,
    "primary_site--address--state": "AL: Alabama",
    "primary_site--address--country": "USA: UNITED STATES",
    "primary_site--address--zip_code": "12345",
    // Congressional district required when country is USA; exactly 6 chars
    "primary_site--congressional_district": "MD-000",
    // Optional attachment — included to exercise the file upload path
    additional_locations_attachment: PPSL_TEST_UPLOAD_FILE,
  } satisfies Partial<Record<keyof typeof PPSL_FORM_CONFIG.fields, string>>;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const PPSL_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "8a30cbe2-f297-49b7-b996-fc22982a3eb5",
  opportunityNumber: "E2E-PPSL-ORG-IND-01",
  formKey: "ppsl",
  expectedPrepopulatedFields: {},
  buildTestData: buildPPSLHappyPathTestData,
};
