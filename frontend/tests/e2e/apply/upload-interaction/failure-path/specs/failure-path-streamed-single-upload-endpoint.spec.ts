/**
 * @feature Failure path - Attachment Form streamed upload endpoint
 * @featureFile e2e/apply/upload-interaction/failure-path/features/failure-path-streamed-single-upload-endpoint.feature
 * @scenario Aborted and failed single-file uploads do not save the file
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  ATTACHMENT_OPPORTUNITY_DATA,
  SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB,
  SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
  SAMPLE_UPLOAD_FILE_PATH_MSWORD_0KB,
  SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
} from "tests/e2e/apply/fixtures/attachment-data";
import {
  ATTACHMENT_FORM_CONFIG,
  fieldDefinitionsAttachment,
} from "tests/e2e/apply/fixtures/attachment-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  createFailureDebugArtifactsCollector,
  type FailureDebugArtifactsCollector,
} from "tests/e2e/utils/common/failure-debug-artifacts-utils";
import {
  abortAttachmentUploadRequest,
  assertUploadDidNotSave,
  expectUploadActionControlVisible,
  expectUploadStatusMessage,
  failAttachmentUploadRequest,
  openApplicationFormWithAuth,
  uploadFile,
} from "tests/e2e/utils/common/file-upload-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_URL = `/opportunity/${ATTACHMENT_OPPORTUNITY_DATA.opportunityId}`;
const TEST_ORG_LABEL = String(testOrgLabel);
type UploadFieldTarget = NonNullable<Parameters<typeof uploadFile>[2]>;
const ATTACHMENT_FIELD =
  fieldDefinitionsAttachment.attachment as UploadFieldTarget;

test.describe("Failure path - Attachment Form streamed upload endpoint", () => {
  let failureDebugArtifacts: FailureDebugArtifactsCollector;

  test.beforeEach(({ page }) => {
    // Start collecting browser/network diagnostics for this individual test run.
    failureDebugArtifacts = createFailureDebugArtifactsCollector(page);
  });

  test.afterEach(async (_fixtureContext, testInfo) => {
    // Attach diagnostics only when the test fails unexpectedly.
    await failureDebugArtifacts.attachOnFailure(testInfo);
  });

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
        TEST_ORG_LABEL,
        OPPORTUNITY_URL,
      );

      // When the applicant uploads a zero-byte file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_MSWORD_0KB,
        ATTACHMENT_FIELD,
      );

      // Then the upload failure message should appear
      await expectUploadStatusMessage(page, /Pre upload error|Upload failed/i);

      // And the dismiss button should be visible
      await expectUploadActionControlVisible(page, "Dismiss");

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_MSWORD_0KB,
        0,
        ATTACHMENT_FIELD,
      );
    },
  );

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
        TEST_ORG_LABEL,
        OPPORTUNITY_URL,
      );

      // And the upload request is aborted as soon as it is routed
      // (this avoids a flaky in-progress timing window)
      await abortAttachmentUploadRequest(page);

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        ATTACHMENT_FIELD,
      );

      // Then the pre-upload error message should appear
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expectUploadActionControlVisible(page, "Dismiss");

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
        0,
        ATTACHMENT_FIELD,
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
        TEST_ORG_LABEL,
        OPPORTUNITY_URL,
      );

      // And the upload request is forced to fail.
      // This stubs both the streaming upload endpoint and the attachment save endpoint.
      await failAttachmentUploadRequest(page);

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        ATTACHMENT_FIELD,
      );

      // Then the pre-upload error message should appear
      await expectUploadStatusMessage(page, "Pre upload error");

      // And the dismiss button should be visible
      await expectUploadActionControlVisible(page, "Dismiss");

      // And the file should not be saved
      await assertUploadDidNotSave(
        page,
        SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
        0,
        ATTACHMENT_FIELD,
      );
    },
  );
});
