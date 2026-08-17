/**
 * @feature File upload interactions - Attachment Form streamed upload endpoint
 * @featureFile e2e/apply/upload-interaction/happy-path/features/happy-path-streamed-upload-endpoint.feature
 * @scenario File upload behavior for Attachment Form using the streamed upload endpoint
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
  expectUploadStatusMessage,
  openApplicationFormWithAuth,
  resolveFileInputLocator,
  stubStreamingAttachmentUpload,
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
test.beforeEach(({ page }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
  page.on("console", (message) => {
    console.log("PAGE CONSOLE [", message.type(), "]", message.text());
  });
  page.on("pageerror", (error) => {
    console.log("PAGE ERROR:", error);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/file") || url.includes("/api/applications/")) {
      console.log("PAGE REQUEST:", request.method(), url);
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/api/file") || url.includes("/api/applications/")) {
      console.log(
        "PAGE REQUEST FAILED:",
        request.method(),
        url,
        request.failure()?.errorText,
      );
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/file") || url.includes("/api/applications/")) {
      console.log("PAGE RESPONSE:", response.status(), url);
    }
  });
});

test.describe("File upload interactions - Attachment Form streamed upload endpoint", () => {
  test(
    "streamed single upload shows progress statuses in sequence and displays delete after completion",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);
      page.on("console", (message) => {
        console.log("PAGE CONSOLE:", message.type(), message.text());
      });
      page.on("pageerror", (error) => {
        console.log("PAGE ERROR:", error);
      });

      // Given the applicant has opened the Attachment Form
      await openApplicationFormWithAuth(
        page,
        context,
        testInfo,
        ATTACHMENT_FORM_CONFIG.formName,
        testOrgLabel,
        OPPORTUNITY_URL,
      );

      // And the streamed upload endpoint is stubbed for the selected file
      await stubStreamingAttachmentUpload(page, {
        fileName: SAMPLE_FILE_NAME,
        delayMs: 1500,
      });

      const attachmentSaveResponse = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes("/api/applications/") &&
          response.url().includes("/attachments") &&
          response.status() === 200,
      );

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.att1,
      );

      // Then initial upload progress status should appear.
      await expectUploadStatusMessage(
        page,
        /(Processing file|Queued|Uploading\.\.\.|Upload complete\. Starting security scan|Upload complete\. Running security scan\.\.\.|Scan complete)/i,
      );

      // And the attachment save request should complete successfully.
      await attachmentSaveResponse;

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
    },
  );

  test(
    "uploaded file is visible after streamed upload completes",
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

      // And the streamed upload endpoint is stubbed for the selected file
      await stubStreamingAttachmentUpload(page, {
        fileName: SAMPLE_FILE_NAME,
      });

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.att1,
      );

      // Then the uploaded file should be visible after the streamed upload completes
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);
      await expect(
        page.getByRole("button", { name: /delete/i }).first(),
      ).toBeVisible();
    },
  );

  test(
    "deleting the streamed upload restores the file input",
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

      // And the streamed upload endpoint is stubbed for the selected file
      await stubStreamingAttachmentUpload(page, {
        fileName: SAMPLE_FILE_NAME,
      });

      // When the applicant uploads a file and then deletes it
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsAttachment.att1,
      );
      await expectUploadedFileVisible(page, SAMPLE_FILE_NAME);

      await deleteUploadedFile(page, SAMPLE_FILE_NAME);

      // Then deleting the uploaded streamed file restores the file input
      await assertFileInputVisible(page, fieldDefinitionsAttachment.att1);
    },
  );

  test(
    "single-file upload does not accept multiple files when using the streamed upload endpoint",
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

      // And the streamed upload endpoint is stubbed for the selected file
      await stubStreamingAttachmentUpload(page, {
        fileName: SAMPLE_FILE_NAME,
      });

      const fileInput = resolveFileInputLocator(
        page,
        fieldDefinitionsAttachment.att1,
      );
      await expect(fileInput).not.toHaveAttribute("multiple");

      // When the applicant attempts to upload multiple files for a single-file attachment
      await uploadFile(
        page,
        [SAMPLE_UPLOAD_FILE, SAMPLE_UPLOAD_FILE],
        fieldDefinitionsAttachment.att1,
      );

      // Then only one file should be accepted and the file input remains hidden during upload
      await expectUploadedFileCount(page, SAMPLE_FILE_NAME, 1);
      await assertFileInputHidden(page, fieldDefinitionsAttachment.att1);
    },
  );
});
