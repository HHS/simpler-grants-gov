/**
 * @feature Failure path - Attachment Form streamed upload endpoint
 * @featureFile e2e/apply/upload-interaction/failure-path/features/failure-path-streamed-single-upload-endpoint.feature
 * @scenario Aborted and failed single-file uploads do not save the file
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
  abortAttachmentUploadRequest,
  assertUploadDidNotSave,
  expectUploadStatusMessage,
  failAttachmentUploadRequest,
  openApplicationFormWithAuth,
  TEST_UPLOAD_DIR,
  uploadFile,
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

test.describe("Failure path - Attachment Form streamed upload endpoint", () => {
  test(
    "aborted upload does not save the file",
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

      // And the upload request is aborted before completion
      await abortAttachmentUploadRequest(page);

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.attachment,
      );

      // Then I should see the "Pre upload error" message
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );

  test(
    "failed single-file upload does not save the file",
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

      // And the upload request is forced to fail
      await failAttachmentUploadRequest(page);

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.attachment,
      );

      // Then I should see the "Pre upload error" message
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );

  test(
    "failed single-file upload of a zero-byte file",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      const SAMPLE_FILE_NAME_2 = "TestMSword0Kb.docx";
      const SAMPLE_UPLOAD_FILE2 = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME_2}`;

      // Given the applicant has opened the Attachment Form
      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        ATTACHMENT_FORM_CONFIG.formName,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the applicant uploads a zero-byte file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE2,
        fieldDefinitionsAttachment.attachment,
      );

      // Then I should see the "Upload failed" message
      await expectUploadStatusMessage(page, "Upload failed");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME_2,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );
});
