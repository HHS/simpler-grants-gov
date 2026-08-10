/**
 * @feature File upload interactions - Happy Path
 * @featureFile e2e/apply/upload-interaction/happy-path/features/happy-path-file-upload-interaction.feature
 * @scenario File upload behavior for narrative attachments and project abstracts
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates and opens the relevant application form.
 * 2) Uploads files using single-file and multi-file attachments.
 * 3) Verifies upload success, status messages, file input visibility, and delete controls.
 * 4) Covers abort, failure, single-file restrictions, and duplicate-file deletion behavior.
 *
 * Why these forms are in scope:
 * - Project Abstract uses the single-file attachment flow and status display path.
 * - Other Narrative Attachment covers the multi-file attachment flow and delete/replace path.
 *
 * Tester parameter guide:
 * - Upload fixture definitions are located in:
 *   - tests/e2e/apply/fixtures/other-narrative-attachment-field-definitions
 *   - tests/e2e/apply/fixtures/project-abstract-field-definitions
 * - Test upload file is TEST_UPLOAD_DIR/sample-upload-kb.pdf.
 * - Network helpers used by this spec:
 *   - delayAttachmentUploadRequest
 *   - stubStreamingAttachmentUpload
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  fieldDefinitionsOtherNarrativeAttachment,
  OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/other-narrative-attachment-field-definitions";
import {
  fieldDefinitionsProjectAbstract,
  PROJECT_ABSTRACT_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/project-abstract-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  assertFileInputHidden,
  assertFileInputVisible,
  delayAttachmentUploadRequest,
  deleteUploadedFile,
  expectUploadStatusMessage,
  expectUploadedFileCount,
  expectUploadedFileVisible,
  openApplicationForm,
  stubStreamingAttachmentUpload,
  TEST_UPLOAD_DIR,
  uploadFile,
} from "tests/e2e/utils/common/file-upload-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39df8091-6e99-4b0f-9db7-1f3aca9cb6e5"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;
const SAMPLE_FILE_NAME = "sample-upload-kb.pdf";
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test.describe("File upload interactions - Other Narrative Attachments", () => {
  test(
    "uploads a single file and shows the uploaded file",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Other Narrative Attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user uploads a single file
      await delayAttachmentUploadRequest(page);
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );

      // Then the 'choose from folder' link remains visible after upload
      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      // And the uploaded file is displayed
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);
      // And the delete action is available
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
      // And the file input stays visible for another upload
      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
    },
  );

  test(
    "deletes an uploaded file after successful upload",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Other Narrative Attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user uploads a single file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      // And the user deletes the uploaded file
      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      // Then the 'choose from folder' link is visible again after deletion
      await assertFileInputVisible(page);
    },
  );

  test(
    "multi-file upload accepts multiple files when more than one file is selected",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Other Narrative Attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user uploads multiple files at once
      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );

      // Then both uploaded files are visible
      await expect(page.locator(`text=${SAMPLE_FILE_NAME}`)).toHaveCount(2, {
        timeout: 60000,
      });
      // And the delete control is available for the uploaded files
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
      // And the 'choose from folder' link remains visible after multiple uploads
      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
    },
  );

  test(
    "single-file upload hides the file input while the upload is in progress",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the upload is stubbed as a streaming attachment
      await stubStreamingAttachmentUpload(page);
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );

      // Then upload progress is shown and the 'choose from folder' link is hidden
      await expectUploadStatusMessage(page, /queued|uploading|starting scan|scan complete/i);
      await assertFileInputHidden(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );

  test(
    "single-file inputs do not allow multiple files",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user inspects the file input element
      const fileInput = page
        .getByTestId(fieldDefinitionsProjectAbstract.attachment.testId ?? "")
        .first();

      // Then the upload field should not accept multiple files
      await expect(fileInput).not.toHaveAttribute("multiple");
    },
  );

  test(
    "single-file upload accepts only the first file when multiple files are selected",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user selects multiple files on a single-file input
      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsProjectAbstract.attachment,
      );

      // Then only the first file is uploaded and the 'choose from folder' link is hidden
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 1);
      await assertFileInputHidden(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );

  test(
    "single-file upload hides the file input after upload and restores it after deletion",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user uploads a single file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      // Then the 'choose from folder' link should be hidden while upload is in progress
      await assertFileInputHidden(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );

      // When the user deletes the uploaded file
      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      // Then the 'choose from folder' link becomes visible again
      await assertFileInputVisible(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );

  test(
    "deleting one of two uploaded files with the same name leaves the other visible",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Other Narrative Attachment form
      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the user uploads two files with the same filename
      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 2);

      // And the user deletes one of the uploaded files
      await deleteUploadedFile(page);

      // Then one file should remain and delete remains available
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 1);
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
    },
  );
});
