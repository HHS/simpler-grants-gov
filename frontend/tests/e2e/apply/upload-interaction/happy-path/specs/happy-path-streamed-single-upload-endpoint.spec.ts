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
  ATTACHMENT_OPPORTUNITY_DATA,
  SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
  SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
} from "tests/e2e/apply/fixtures/attachment-data";
import {
  ATTACHMENT_FORM_CONFIG,
  fieldDefinitionsAttachment,
} from "tests/e2e/apply/fixtures/attachment-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  assertFileInputHidden,
  assertFileInputVisible,
  deleteUploadedFile,
  expectUploadedFileCount,
  expectUploadedFileVisible,
  expectUploadProgressStatusMessage,
  openApplicationFormWithAuth,
  resolveFileInputLocator,
  uploadFile,
  waitForAttachmentSaveResponse,
} from "tests/e2e/utils/common/file-upload-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${ATTACHMENT_OPPORTUNITY_DATA.opportunityId}`;

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

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        fieldDefinitionsAttachment.attachment,
      );

      // Then a standard upload progress state should be displayed.
      await expectUploadProgressStatusMessage(page);

      // And the attachment save request should complete successfully: Check for the save response from the server
      await waitForAttachmentSaveResponse(page);

      // Then the uploaded file should be visible
      await expectUploadedFileVisible(page, SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB);
    },
  );

  test(
    "deleting the uploaded streamed file restores the file input on single file inputs",
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

      // When the applicant uploads a ZIP file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        fieldDefinitionsAttachment.attachment,
      );

      // Then the uploaded file should be visible
      await expectUploadedFileVisible(page, SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB);

      // When the applicant deletes the uploaded file
      await deleteUploadedFile(page, SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB);

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

      // And the applicant provides multiple files to a single-file field
      // (the helper will only upload the first file for non-multiple inputs)
      await uploadFile(
        page,
        [
          SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
          SAMPLE_UPLOAD_FILE_PATH_ZIP_3543KB,
        ],
        fieldDefinitionsAttachment.att1,
      );

      // Then only one uploaded file should be accepted.
      await expectUploadedFileCount(
        page,
        SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB,
        1,
      );

      // And the uploaded file should be visible
      await expectUploadedFileVisible(page, SAMPLE_UPLOAD_FILE_NAME_ZIP_3543KB);

      // And the "Choose from folder" should be hidden after a file is uploaded
      await assertFileInputHidden(page, fieldDefinitionsAttachment.att1);
    },
  );
});
