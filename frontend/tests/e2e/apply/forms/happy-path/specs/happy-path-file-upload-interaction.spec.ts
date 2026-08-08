import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import {
  OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/other-narrative-attachment-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  abortAttachmentUploadRequest,
  assertFileInputHidden,
  assertFileInputVisible,
  deleteUploadedFile,
  delayAttachmentUploadRequest,
  expectUploadStatusMessage,
  expectUploadedFileVisible,
  openApplicationForm,
  TEST_UPLOAD_DIR,
  uploadFile,
} from "tests/e2e/utils/forms/file-upload-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39df8091-6e99-4b0f-9db7-1f3aca9cb6e5"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test.describe("File upload interactions - Other Narrative Attachments", () => {
  test(
    "uploads a single file and shows upload status",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await delayAttachmentUploadRequest(page);
      await uploadFile(page, SAMPLE_UPLOAD_FILE);

      await expectUploadStatusMessage(page, /uploading/i);
      await expectUploadedFileVisible(page, "sample-upload-kb.pdf");
      await expect(page.getByRole("button", { name: /delete/i }).first()).toBeVisible();
      await assertFileInputHidden(page);
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

      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(page, SAMPLE_UPLOAD_FILE);
      await expectUploadedFileVisible(page, "sample-upload-kb.pdf");
      await deleteUploadedFile(page, "sample-upload-kb.pdf");
      await assertFileInputVisible(page);
    },
  );

  test(
    "handles upload cancellation when the attachment request is aborted",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await abortAttachmentUploadRequest(page);
      await uploadFile(page, SAMPLE_UPLOAD_FILE);

      await expect(page.locator("text=sample-upload-kb.pdf")).toHaveCount(0, {
        timeout: 60000,
      });
      await assertFileInputVisible(page);
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

      await openApplicationForm(
        page,
        context,
        testInfo,
        OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      await uploadFile(page, [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE]);
      await expectUploadedFileVisible(page, "sample-upload-kb.pdf");
      await expect(page.getByRole("button", { name: /delete/i }).first()).toBeVisible();
    },
  );
});
