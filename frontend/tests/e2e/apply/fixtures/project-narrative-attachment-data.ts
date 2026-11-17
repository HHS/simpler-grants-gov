import crypto from "crypto";
import fs from "fs";
import path from "path";
import { projectNarrativeAttachmentHappyPathTestData } from "tests/e2e/apply/fixtures/project-narrative-attachment-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

/**
 * Happy-path test data builder for the Project Narrative Attachment form.
 * The only field is a file upload, so the suffix is unused; it is kept to match
 * the PrintViewFormData builder interface.
 */
export const buildPNAHappyPathTestData = (
  _suffix: number,
): Record<string, string> => ({
  ...projectNarrativeAttachmentHappyPathTestData,
});

const baseName = (filePath: string): string => path.basename(filePath);

/** MIME type the browser reports when it uploads the .pdf test file. */
const PNA_UPLOAD_MIME_TYPE = "application/pdf";

/**
 * Values the XML records about the uploaded file that are not typed into the form:
 * its MIME type and its hash. The API writes the hash as base64-encoded SHA-1 of the
 * file content (the algorithm Grants.gov's HashValue element expects), so it is
 * computed here from the local file that was uploaded. Pass as systemValues.
 */
export const pnaDerivedValues = (
  testData: Record<string, string>,
): Record<string, string> => ({
  attachment_mime_type: PNA_UPLOAD_MIME_TYPE,
  attachment_hash: crypto
    .createHash("sha1")
    .update(fs.readFileSync(testData.attachments))
    .digest("base64"),
});

/**
 * Contains opportunity metadata and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 * The opportunity is created by the local seed and by the staging automatic
 * opportunities task (prefix "E2E-PNA").
 */
export const PNA_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "6bdc2df3-6e51-4aea-89af-bade326feba1",
  opportunityNumber: "E2E-PNA-ORG-IND-01",
  formKey: "projectNarrativeAttachment",
  expectedPrepopulatedFields: {},
  buildTestData: buildPNAHappyPathTestData,
  // What the submission zip spec verifies (XML element and/or PDF text).
  // attachment_mime_type and attachment_hash come from pnaDerivedValues(); the spec supplies them.
  // FileLocation (att:href) is not verified: it carries the stored file location, not a stable value.
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
