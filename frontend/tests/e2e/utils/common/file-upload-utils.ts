/**
 * Shared helpers for file upload interaction tests.
 *
 * Reviewer guide (what logic):
 * These helpers cover common upload scenarios for E2E tests:
 * - authenticating and opening the correct application form,
 * - locating the file input,
 * - uploading files,
 * - checking uploaded file status,
 * - deleting files, and
 * - stubbing upload endpoints.
 *
 * Common update points:
 * - TEST_UPLOAD_DIR: fixture files used for upload tests
 * - openApplicationFormWithAuth: authenticates, creates an application, and opens the correct form
 * - resolveFileInputLocator: how the file input is found from a field config or test ID
 * - stubStreamingAttachmentUpload: mock file streaming and attachment save
 */

import path from "path";
import { PassThrough } from "stream";
import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { type FillFieldDefinition } from "tests/e2e/utils/common/types";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";

// Directory of fixture files used by file upload tests.
export const TEST_UPLOAD_DIR = path.resolve(
  __dirname,
  "../../test-upload-files",
);

/**
 * Authenticate the test user, create a new application, and open the requested form.
 *
 * This helper is intentionally higher-level: it handles auth, application setup,
 * and then uses the form matcher to navigate to the target form.
 */
export async function openApplicationFormWithAuth(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  formMatcher: string | RegExp,
  organizationLabel: string,
  opportunityUrl: string,
): Promise<void> {
  const isMobile = testInfo.project.name.match(/[Mm]obile/);
  await authenticateE2eUser(page, context, !!isMobile);
  await createApplication(page, opportunityUrl, organizationLabel);

  const opened = await openForm(page, formMatcher);
  if (!opened) {
    throw new Error(`Could not find or open form: ${formMatcher}`);
  }
}

type FileInputTarget = string | FillFieldDefinition;

/**
 * Find the file input element from a test ID or a field definition.
 *
 * Supports either a string test ID or a field definition object.
 * When a field definition is provided, selector lookup takes precedence
 * over testId lookup.
 */
export function resolveFileInputLocator(page: Page, target: FileInputTarget): Locator {
  if (typeof target === "string") {
    return page.getByTestId(target).first();
  }
  if (target.selector) {
    return page.locator(target.selector).first();
  }
  if (target.testId) {
    return page.getByTestId(target.testId).first();
  }
  throw new Error(
    `File field ${target.field} requires a selector or testId to locate the input`,
  );
}

/**
 * Upload one or more files using the resolved file input.
 *
 * If the resolved input does not accept multiple files and an array is
 * provided, only the first file is uploaded to avoid invalid input behavior.
 */
export async function uploadFile(
  page: Page,
  filePath: string | string[],
  fileInputTarget: FileInputTarget = "file-input-input",
): Promise<void> {
  const fileInput = resolveFileInputLocator(page, fileInputTarget);
  await fileInput.waitFor({ state: "visible", timeout: 30000 });
  const acceptsMultiple = await fileInput.evaluate(
    (input: HTMLInputElement) => input.multiple,
  );
  if (Array.isArray(filePath) && !acceptsMultiple) {
    await fileInput.setInputFiles(filePath[0]);
    return;
  }
  await fileInput.setInputFiles(filePath);
}

/**
 * Upload files by directly selecting a native file input selector.
 */
export async function uploadFileBySelector(
  page: Page,
  selector: string,
  filePath: string | string[],
): Promise<void> {
  const fileInput = page.locator(selector).first();
  await fileInput.waitFor({ state: "visible", timeout: 30000 });
  await fileInput.setInputFiles(filePath);
}

/**
 * Return a locator for the uploaded file entry shown in the existing files list.
 */
function getExistingFileEntryLocator(page: Page, fileName: string): Locator {
  return page
    .locator('[data-testid="file-input-existing-files"]')
    .locator(`text=${fileName}`)
    .first();
}

/**
 * Wait for the uploaded file entry to appear in the UI.
 */
export async function expectUploadedFileVisible(
  page: Page,
  fileName: string,
  timeoutMs = 60000,
): Promise<void> {
  const entryLocator = getExistingFileEntryLocator(page, fileName);
  await expect(entryLocator).toBeVisible({
    timeout: timeoutMs,
  });
}

/**
 * Assert how many uploaded file entries exist for the given filename.
 */
export async function expectUploadedFileCount(
  page: Page,
  fileName: string,
  count: number,
  timeoutMs = 60000,
): Promise<void> {
  const entryLocator = page
    .locator('[data-testid="file-input-existing-files"]')
    .locator(`text=${fileName}`);
  if ((await entryLocator.count()) > 0) {
    await expect(entryLocator).toHaveCount(count, {
      timeout: timeoutMs,
    });
    return;
  }

  await expect(page.getByText(fileName)).toHaveCount(count, {
    timeout: timeoutMs,
  });
}

/**
 * Delete a displayed uploaded file and confirm it is removed from the UI.
 * If `fileName` is omitted, the first visible delete/remove action is used.
 */
export async function deleteUploadedFile(
  page: Page,
  fileName?: string,
): Promise<void> {
  const deleteButton = fileName
    ? page
        .locator(
          `xpath=//div[@data-testid="file-input-existing-files"]//div[contains(normalize-space(.), "${fileName}")]//button[contains(normalize-space(.), "Delete") or contains(normalize-space(.), "Remove")]`,
        )
        .first()
    : page
        .locator(
          `xpath=//div[@data-testid="file-input-existing-files"]//button[contains(normalize-space(.), "Delete") or contains(normalize-space(.), "Remove")]`,
        )
        .first();

  await deleteButton.click();

  const confirmDeleteButton = page
    .getByRole("button", {
      name: /delete file/i,
    })
    .first();
  await expect(confirmDeleteButton).toBeVisible({ timeout: 30000 });
  await confirmDeleteButton.click();

  if (fileName) {
    await expect(
      page
        .locator('[data-testid="file-input-existing-files"]')
        .locator(`text=${fileName}`),
    ).toHaveCount(0, {
      timeout: 60000,
    });
  }
}

/**
 * Stub the attachment upload endpoints so the upload fails.
 *
 * Some forms upload via /api/file and others use /api/applications/:id/attachments.
 */
export async function failAttachmentUploadRequest(
  page: Page,
  status = 500,
  responseBody = { error: "Upload failed" },
): Promise<void> {
  const failRoute = async (route: Route) => {
    await route.fulfill({
      status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseBody),
    });
  };

  await page.route("**/api/file**", failRoute);
  await page.route("**/api/applications/**/attachments**", failRoute);
}

/**
 * Stub the streaming upload flow and the attachment creation API.
 *
 * This simulates the real upload lifecycle by returning multiple upload
 * progress states before the attachment is created.
 */
export type StubStreamingAttachmentUploadOptions = {
  pendingFileId?: string;
  applicationAttachmentId?: string;
  fileName: string;
  delayMs?: number;
};

export async function stubStreamingAttachmentUpload(
  page: Page,
  {
    pendingFileId = "fake-pending-file-id",
    applicationAttachmentId = "fake-attachment-id",
    fileName,
    delayMs = 1500,
  }: StubStreamingAttachmentUploadOptions,
): Promise<void> {
  await page.route("**/api/file**", async (route) => {
    const chunks = [
      JSON.stringify({ status: "queued" }),
      JSON.stringify({ status: "uploading" }),
      JSON.stringify({ status: "starting-scan" }),
      JSON.stringify({ status: "pending" }),
      JSON.stringify({ status: "scan-complete", pendingFileId }),
    ];

    const fullBody = Buffer.from(chunks.join(""));
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: fullBody,
    });
  });

  await page.route("**/api/applications/**/attachments**", async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const attachment = {
      application_attachment_id: applicationAttachmentId,
      file_name: fileName,
      file_size_bytes: 1024,
      mime_type: "application/pdf",
      updated_at: new Date().toISOString(),
      download_path: `/download/${fileName}`,
    };
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: attachment,
      }),
    });
  });
}

/**
 * Assert that the resolved file input is visible.
 */
export async function assertFileInputVisible(
  page: Page,
  fileInputTarget: FileInputTarget = "file-input-input",
): Promise<void> {
  await expect(resolveFileInputLocator(page, fileInputTarget)).toBeVisible({
    timeout: 30000,
  });
}

/**
 * Assert that the resolved file input is hidden.
 */
export async function assertFileInputHidden(
  page: Page,
  fileInputTarget: FileInputTarget = "file-input-input",
): Promise<void> {
  await expect(resolveFileInputLocator(page, fileInputTarget)).not.toBeVisible({
    timeout: 30000,
  });
}

export async function assertUploadDidNotSave(
  page: Page,
  fileName: string,
  expectedCount: number,
  fileInputTarget: FileInputTarget = "file-input-input",
): Promise<void> {
  await expect(page.locator(`text=${fileName}`)).toHaveCount(expectedCount, {
    timeout: 60000,
  });

  if (expectedCount === 0) {
    await assertFileInputVisible(page, fileInputTarget);
  }
}

/**
 * Wait for the upload status message text to appear.
 *
 * Some pages render a dedicated status display, while others only show
 * transient status text in the page body. This helper checks both.
 */
const matchesText = (text: string, message: string | RegExp) => {
  return typeof message === "string"
    ? text.includes(message)
    : message.test(text);
};

export async function expectUploadStatusMessage(
  page: Page,
  message: string | RegExp,
  timeoutMs = 30000,
): Promise<void> {
  const statusDisplay = page.getByTestId("file-upload-status-display").first();
  if ((await statusDisplay.count()) > 0) {
    await expect(statusDisplay).toBeVisible({ timeout: timeoutMs });
    const statusText = await statusDisplay.innerText();
    if (matchesText(statusText, message)) {
      return;
    }
  }

  await expect(page.getByText(message)).toBeVisible({
    timeout: timeoutMs,
  });
}

/**
 * Delay the upload request so tests can observe upload progress.
 */
export async function delayAttachmentUploadRequest(
  page: Page,
  delayMs = 1500,
): Promise<void> {
  await page.route("**/api/file*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Abort upload-related requests to simulate a cancel before the attachment is saved.
 *
 * This aborts both the streaming file upload request and the subsequent
 * attachment creation request, which is more reliable for fast uploads.
 * It ensures a cancelled upload does not leave behind a partially saved attachment.
 */
export async function abortAttachmentUploadRequest(
  page: Page,
  delayMs = 0,
): Promise<void> {
  const abortRoute = async (route: Route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.abort("aborted");
  };

  await Promise.all([
    page.route("**/api/file**", abortRoute),
    page.route("**/api/applications/**/attachments**", abortRoute),
  ]);
}
