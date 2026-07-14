import path from "path";
import type { ATTACHMENT_FORM_CONFIG } from "tests/e2e/apply/fixtures/attachment-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

// Uploaded files validated by section locator in print view.
const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");
const ATTACHMENT_TEST_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

/**
 * Happy-path test data builder for the Attachment Form.
 * All fields are file uploads - no dynamic text values, so suffix is unused.
 * Signature matches the builder interface required by PrintViewFormData.
 */
export const buildAttachmentHappyPathTestData = (
  _suffix: number,
): Record<string, string> => {
  return {
    att1: ATTACHMENT_TEST_UPLOAD_FILE,
  } satisfies Partial<
    Record<keyof typeof ATTACHMENT_FORM_CONFIG.fields, string>
  >;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const ATTACHMENT_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "97ee34df-fd89-400d-b4d4-ac9c5c7f61c1",
  opportunityNumber: "E2E-ATT-ORG-IND-01",
  formKey: "attachment",
  expectedPrepopulatedFields: {},
  buildTestData: buildAttachmentHappyPathTestData,
};
