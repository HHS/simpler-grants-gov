/**
 * @feature File upload interactions - Failure Path
 * @featureFile e2e/apply/upload-interaction/failure-path/features/failure-path-streamed-single-upload-endpoint.feature
 * @scenario Upload error handling for project abstract single-file attachments
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
import { createAuthenticatedApplicationLifecycle } from "tests/e2e/utils/common/auth-storage-state-utils";
import {
  abortAttachmentUploadRequest,
  assertUploadDidNotSave,
  failAttachmentUploadRequest,
  openApplicationFormWithAuth,
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
const SAMPLE_FILE_NAME = "TestZip3543Kb.zip";
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME}`;

const authenticatedLifecycle = createAuthenticatedApplicationLifecycle({
  targetEnv,
  opportunityUrl: OPPORTUNITY_URL,
  organizationLabel: testOrgLabel,
  timeoutMs: 300_000,
  skipTest: (condition, description) => test.skip(condition, description),
});

test.beforeAll(authenticatedLifecycle.beforeAll);
test.beforeEach(authenticatedLifecycle.beforeEach);
test.afterEach(authenticatedLifecycle.afterEach);

test.describe("Single file upload interactions - Failure Path", () => {
  test(
    "aborted upload keeps the choose from folder link visible",
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

      // Then I should not see the file saved and the "choose from folder" link should remain visible
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );

  test(
    "failed single-file upload keeps the choose from folder link visible",
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

      // Then I should not see the file saved and the "choose from folder" link should remain visible
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsAttachment.attachment,
      );
    },
  );
});
