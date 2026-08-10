/**
 * @feature File upload interactions - Failure Path
 * @featureFile e2e/apply/upload-interaction/failure-path/features/failure-path-file-upload-interaction.feature
 * @scenario Upload error handling for narrative attachments and project abstracts
 *
 * Notes for reviewer (what happens in this test):
 * 1) Authenticates and opens the relevant application form.
 * 2) Stubs failed and aborted attachment uploads.
 * 3) Verifies that no file is saved on error or abort.
 * 4) Confirms the upload chooser remains visible so the user can retry.
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
  abortAttachmentUploadRequest,
  assertFileInputVisible,
  expectUploadStatusMessage,
  failAttachmentUploadRequest,
  openApplicationForm,
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

test.describe("File upload interactions - Failure Path", () => {
  test(
    "aborted upload keeps the choose from folder link visible",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      // Given the user has opened the "Other Narrative Attachment" form
      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the upload request is aborted before completion
      await abortAttachmentUploadRequest(page);

      // And the user uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );

      // Then no file is saved
      await expect(page.locator(`text=${SAMPLE_FILE_NAME}`)).toHaveCount(0, {
        timeout: 60000,
      });

      // And the 'choose from folder' link remains visible
      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
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

      // Given the user has opened the "Project Abstract" form
      await openApplicationForm(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // When the upload request fails
      await failAttachmentUploadRequest(page);

      // And the user uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );

      // Then an upload error is displayed
      await expectUploadStatusMessage(page, "Upload failed");

      // And no file is saved
      await expect(page.locator(`text=${SAMPLE_FILE_NAME}`)).toHaveCount(0, {
        timeout: 60000,
      });

      // And the 'choose from folder' link remains visible
      await assertFileInputVisible(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );
});
