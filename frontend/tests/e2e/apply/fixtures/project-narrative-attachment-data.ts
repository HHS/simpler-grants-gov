import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");

export const projectNarrativeAttachmentHappyPathTestData: Record<
  string,
  string
> = {
  attachments: `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`,
};

const baseName = (filePath: string): string => path.basename(filePath);

/** PDF entry in the submission zip: the API's short_form_name + ".pdf". */
export const PROJECT_NARRATIVE_ATTACHMENT_ZIP_PDF_NAME =
  "ProjectNarrativeAttachments_1_2.pdf";

/** MIME type the browser reports when it uploads the .pdf test file. */
const PROJECT_NARRATIVE_ATTACHMENT_UPLOAD_MIME_TYPE = "application/pdf";

/**
 * Values the submission XML records about the uploaded file that are not typed
 * into the form: its MIME type and its hash. The API writes the hash as the
 * base64-encoded SHA-1 of the file content, so it is computed here from the
 * local file that was uploaded. Pass the result as systemValues.
 */
export const projectNarrativeAttachmentDerivedValues = (
  testData: Record<string, string>,
): Record<string, string> => ({
  attachment_mime_type: PROJECT_NARRATIVE_ATTACHMENT_UPLOAD_MIME_TYPE,
  attachment_hash: crypto
    .createHash("sha1")
    .update(fs.readFileSync(testData.attachments))
    .digest("base64"),
});

// Both renderers use the existing upload field and the same file fixture.
const buildTestData = (_suffix: number): Record<string, string> => ({
  ...projectNarrativeAttachmentHappyPathTestData,
});

export const PROJECT_NARRATIVE_ATTACHMENT_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "6bdc2df3-6e51-4aea-89af-bade326feba1",
    opportunityNumber: "E2E-PNA-ORG-IND-01",
    formKey: "projectNarrative",
    expectedPrepopulatedFields: {},
    buildTestData,
    // What the submission zip spec verifies (XML element and/or PDF text).
    // attachment_mime_type and attachment_hash come from projectNarrativeAttachmentDerivedValues().
    // FileLocation (att:href) is not verified: it carries the stored file location,
    // not a stable value.
    submissionFields: {
      attachments: {
        xmlElement: "att:FileName",
        xmlTransform: baseName,
        verifyInPdf: true,
        pdfTransform: baseName,
      },
      attachment_mime_type: { xmlElement: "att:MimeType" },
      attachment_hash: {
        xmlElement: "glob:HashValue",
        xmlAllowAttributes: true,
      },
    },
  };

export const PROJECT_NARRATIVE_ATTACHMENT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "3b41ad38-a4eb-43e2-b124-7ebf56b05b1a",
    opportunityNumber: "E2E-PNAG-ORG-IND-01",
    formKey: "projectNarrativeGenerated",
    expectedPrepopulatedFields: {},
    buildTestData,
  };

export const PROJECT_NARRATIVE_ATTACHMENT_OPPORTUNITIES = [
  {
    formLabel: "Project Narrative Attachment Form",
    opportunityNumber:
      PROJECT_NARRATIVE_ATTACHMENT_OPPORTUNITY_DATA.opportunityNumber,
    attachmentSectionId: "form-section-projectNarrativeFiles",
  },
  {
    formLabel: "Project Narrative Attachment Form (Generated)",
    opportunityNumber:
      PROJECT_NARRATIVE_ATTACHMENT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    attachmentSectionId: "form-section-1-project-narrative-file-s",
  },
] as const;
