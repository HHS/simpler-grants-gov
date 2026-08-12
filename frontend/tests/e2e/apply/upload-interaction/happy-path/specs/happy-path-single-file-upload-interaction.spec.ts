/**
 * @feature File upload interactions - Project Abstract (single-file)
 * @featureFile e2e/apply/upload-interaction/happy-path/features/happy-path-file-upload-interaction.feature
 * @scenario File upload behavior for single-file project abstract attachments
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
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
  deleteUploadedFile,
  expectUploadedFileCount,
  expectUploadedFileVisible,
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
const SAMPLE_FILE_NAME = "sample-upload-kb.pdf";
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test.describe("File upload interactions - Project Abstract", () => {
  // Comment this test for only streamed upload endpoint that supports virus scanning
  //   test(
  //     "single-file upload hides the file input while the upload is in progress",
  //     { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
  //     async (
  //       { page, context }: { page: Page; context: BrowserContext },
  //       testInfo: TestInfo,
  //     ) => {
  //       test.setTimeout(300_000);

  //       await openApplicationForm(
  //         page,
  //         context,
  //         testInfo,
  //         PROJECT_ABSTRACT_FORM_MATCHER,
  //         testOrgLabel,
  //         OPPORTUNITY_URL,
  //       );

  //       await stubStreamingAttachmentUpload(page);
  //       await uploadFile(
  //         page,
  //         SAMPLE_UPLOAD_FILE,
  //         fieldDefinitionsProjectAbstract.attachment,
  //       );

  //       await expectUploadStatusMessage(
  //         page,
  //         /queued|uploading|starting scan|scan complete/i,
  //       );
  //       await assertFileInputHidden(
  //         page,
  //         fieldDefinitionsProjectAbstract.attachment,
  //       );
  //     },
  //   );

  test(
    "single-file inputs do not allow multiple files",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      const fileInput = page
        .getByTestId(fieldDefinitionsProjectAbstract.attachment.testId ?? "")
        .first();

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

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsProjectAbstract.attachment,
      );

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

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        PROJECT_ABSTRACT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      await assertFileInputHidden(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );

      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      await assertFileInputVisible(
        page,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );
});
