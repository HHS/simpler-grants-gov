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
import { OPPORTUNITY_ID_STREAMED_UPLOAD } from "tests/e2e/apply/fixtures/general-apply-fixtures";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  abortAttachmentUploadRequest,
  assertUploadDidNotSave,
  expectUploadStatusMessage,
  failAttachmentUploadRequest,
  openApplicationFormWithAuth,
  uploadFile,
} from "tests/e2e/utils/common/file-upload-utils";
import {
  SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
  SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
  SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB,
  SAMPLE_UPLOAD_FILE_PATH_MSWORD_0KB,
} from "tests/e2e/apply/fixtures/attachment-data";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID_STREAMED_UPLOAD}`;

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

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the pre-upload error message should appear
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
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

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the pre-upload error message should appear
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
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
        SAMPLE_UPLOAD_FILE_PATH_MSWORD_0KB,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the upload failure message should appear
      await expectUploadStatusMessage(page, "Upload failed");

      // And the dismiss button should be visible
      await expect(page.getByRole("button", { name: /dismiss/i })).toBeVisible({
        timeout: 30000,
      });

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );
});
