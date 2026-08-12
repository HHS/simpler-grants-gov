/**
 * @feature File upload interactions - Other Narrative Attachments (multi-file)
 * @featureFile e2e/apply/upload-interaction/happy-path/features/happy-path-file-upload-interaction.feature
 * @scenario File upload behavior for multi-file narrative attachments
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
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
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

test.describe("File upload interactions - Other Narrative Attachments", () => {
  test(
    "uploads a single file and shows the uploaded file",
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
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );

      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
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

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
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

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );

      await expect(page.locator(`text=${SAMPLE_FILE_NAME}`)).toHaveCount(2, {
        timeout: 60000,
      });
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
      await assertFileInputVisible(
        page,
        fieldDefinitionsOtherNarrativeAttachment.attachments,
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

      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsOtherNarrativeAttachment.attachments,
      );
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 2);

      await deleteUploadedFile(page);

      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 1);
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
    },
  );
});
