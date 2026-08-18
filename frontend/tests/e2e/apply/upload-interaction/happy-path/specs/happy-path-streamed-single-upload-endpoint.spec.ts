/**
 * @feature File upload interactions - Attachment Form streamed upload endpoint
 * @featureFile e2e/apply/upload-interaction/happy-path/specs/happy-path-streamed-single-upload-endpoint.feature
 * @scenario Streamed single-file upload shows progress statuses and allows deletion after completion
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  ATTACHMENT_FORM_CONFIG,
  fieldDefinitionsAttachment,
} from "tests/e2e/apply/fixtures/attachment-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  assertFileInputHidden,
  assertFileInputVisible,
  deleteUploadedFile,
  expectUploadedFileCount,
  expectUploadedFileVisible,
  expectUploadProgressStatusMessage,
  openApplicationFormWithAuth,
  resolveFileInputLocator,
  TEST_UPLOAD_DIR,
  uploadFile,
  waitForAttachmentSaveResponse,
} from "tests/e2e/utils/common/file-upload-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "97ee34df-fd89-400d-b4d4-ac9c5c7f61c1"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;
const SAMPLE_FILE_NAME = "TestZip3543Kb.zip";
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test.describe("File upload interactions - Attachment Form streamed upload endpoint", () => {
  test(
    "streamed single-file upload shows progress statuses and allows deletion after completion",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Attachment Form
      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        ATTACHMENT_FORM_CONFIG.formName,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the upload progress status should be displayed: "Uploading...", "Processing...", and "Completed" in sequence.
      await expectUploadProgressStatusMessage(page);

      // And the attachment save request should complete successfully: Check for the save response from the server
      await waitForAttachmentSaveResponse(page);

      const saveButton = page
        .getByRole("button", {
          name: /save and refresh/i,
        })
        .first();
      await expect(saveButton).toBeEnabled({ timeout: 60000 });

      // Cleanup: the upload cancel action should no longer be available.
      await expect(
        page.getByRole("button", { name: /cancel/i }).first(),
      ).not.toBeVisible({ timeout: 60000 });

      // Then the uploaded file should be visible after the streamed upload completes
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
    },
  );

  test(
    "deleting the uploaded streamed file restores the file input",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Attachment Form
      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        ATTACHMENT_FORM_CONFIG.formName,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the uploaded file should be visible
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      // Then the "Choose from folder" should be visible again after deleting the uploaded file
      await assertFileInputVisible(page, fieldDefinitionsAttachment.attachment);
    },
  );

  test(
    "single-file attachment should not accept multiple files",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the applicant has opened the Attachment Form
      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        ATTACHMENT_FORM_CONFIG.formName,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      const fileInput = resolveFileInputLocator(
        page,
        fieldDefinitionsAttachment.att1,
      );

      // When checking the file input attributes
      await expect(fileInput).not.toHaveAttribute("multiple");

      // And the applicant attempts to upload multiple files
      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsAttachment.att1,
      );

      // Then only one file should be accepted
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 1);

      // And the uploaded file should be visible
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);
      
      // And the "Choose from folder" should be hidden after a file is uploaded
      await assertFileInputHidden(page, fieldDefinitionsAttachment.att1);
    },
  );
});
