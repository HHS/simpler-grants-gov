import path from "path";
import type { ATTACHMENT_FORM_CONFIG } from "tests/e2e/apply/fixtures/attachment-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

// Uploaded files validated by section locator in print view.
// These names and paths are shared by attachment upload tests.
// Filenames are exposed separately from the full path for use in UI assertions.
export const TEST_UPLOAD_DIR = path.resolve(
  __dirname,
  "../../test-upload-files",
);
export const ATTACHMENT_TEST_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

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

export const ATTACHMENT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  ...ATTACHMENT_OPPORTUNITY_DATA,
  opportunityId: "84fd9552-81fa-4765-a6f0-13ece83d68ab",
  opportunityNumber: "E2E-ATTG-ORG-IND-01",
  formKey: "attachmentGenerated",
};

export const ATTACHMENT_OPPORTUNITIES = [
  {
    variant: "handwritten",
    opportunityNumber: ATTACHMENT_OPPORTUNITY_DATA.opportunityNumber,
    sectionHeading: "1) Attachment 1",
    firstSection: "form-section-attachment1",
    secondSection: "form-section-attachment2",
    secondField: "Attachment 2",
  },
  {
    variant: "generated",
    opportunityNumber: ATTACHMENT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    sectionHeading: "Application files",
    firstSection: "form-section-application-files",
    secondSection: "form-section-application-files",
    secondField: "2) Please attach Attachment 2",
  },
] as const;

export const SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB = "TestZip3543Kb.zip";
export const SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB = path.join(
  TEST_UPLOAD_DIR,
  SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
);

export const SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB = "TestMSword0Kb.docx";
export const SAMPLE_UPLOAD_FILE_PATH_MSWORD_0KB = path.join(
  TEST_UPLOAD_DIR,
  SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB,
);
