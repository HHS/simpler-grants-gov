/**
 * Shared helpers for file upload interaction tests.
 *
 * Reviewer guide:
 * These helpers cover common upload scenarios for E2E tests:
 * - authenticating and opening the correct application form
 * - locating the file input
 * - uploading files
 * - checking upload status and retry/failure UI
 * - deleting uploaded files
 * - stubbing and controlling upload endpoint behavior
 *
 * Common update points:
 * - TEST_UPLOAD_DIR: fixture files used by file upload tests
 * - openApplicationFormWithAuth: auth, application setup, and form navigation
 * - resolveFileInputLocator: locate the file input from a field config or test ID
 * - expectUploadProgressStatusMessage: checks upload progress states
 * - waitForAttachmentSaveResponse: waits for the attachment save POST response
 */

import path from "path";
import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Response,
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
  // Detect whether this test is running in a mobile project configuration.
  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  // Authenticate the E2E user and preserve session cookies in the browser context.
  await authenticateE2eUser(page, context, !!isMobile);

  // Create a new application for the current opportunity before opening the form.
  await createApplication(page, opportunityUrl, organizationLabel);

  // Open the target form using the provided matcher and fail if it cannot be found.
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
export function resolveFileInputLocator(
  page: Page,
  target: FileInputTarget,
): Locator {
  // If a test ID string is provided, use the test ID locator.
  if (typeof target === "string") {
    return page.getByTestId(target).first();
  }

  // Prefer a supplied selector when the field definition includes one.
  if (target.selector) {
    return page.locator(target.selector).first();
  }

  // Fallback to testId defined on the field definition.
  if (target.testId) {
    return page.getByTestId(target.testId).first();
  }

  const fieldName =
    typeof target.field === "string" ? target.field : "unknown field";
  throw new Error(
    `File field ${fieldName} requires a selector or testId to locate the input`,
  );
}

/**
 * Return the nearest file input wrapper for the resolved file input.
 *
 * This is used for visibility assertions around the file input drop target.
 */
function resolveFileInputWrapperLocator(
  page: Page,
  target: FileInputTarget,
): Locator {
  // Resolve the actual file input first, then find its parent drop-target wrapper.
  const fileInput = resolveFileInputLocator(page, target);
  const wrapper = fileInput.locator(
    'xpath=ancestor::div[@data-testid="file-input-droptarget"]',
  );
  return wrapper.first();
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
  // Find the file input element for the requested upload field.
  const fileInput = resolveFileInputLocator(page, fileInputTarget);

  // Wait until the file input is visible before interacting with it.
  await fileInput.waitFor({ state: "visible", timeout: 30000 });

  // Inspect whether the input supports multiple file selection.
  const acceptsMultiple = await fileInput.evaluate(
    (input: HTMLInputElement) => input.multiple,
  );

  // If multiple files were passed but the input only accepts one, upload only the first.
  if (Array.isArray(filePath) && !acceptsMultiple) {
    await fileInput.setInputFiles(filePath[0]);
    return;
  }

  // Otherwise, upload the provided file or files directly.
  await fileInput.setInputFiles(filePath);
}

/**
 * Normalize any provided file path to just the file name.
 */
function normalizeUploadedFileName(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, "");
}

/**
 * Return a locator for the uploaded file entry shown in the existing files list.
 */
function getExistingFileEntryLocator(page: Page, fileName: string): Locator {
  const normalizedFileName = normalizeUploadedFileName(fileName);
  return page
    .locator('[data-testid="file-input-existing-files"]')
    .locator(`text=${normalizedFileName}`)
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
  const normalizedFileName = normalizeUploadedFileName(fileName);
  const entryLocator = page
    .locator('[data-testid="file-input-existing-files"]')
    .locator(`text=${normalizedFileName}`);

  // If the expected count is zero, assert there are no entries.
  if (count === 0) {
    await expect(entryLocator).toHaveCount(0, {
      timeout: timeoutMs,
    });
    return;
  }

  // If entries already exist, validate the exact count.
  if ((await entryLocator.count()) > 0) {
    await expect(entryLocator).toHaveCount(count, {
      timeout: timeoutMs,
    });
    return;
  }

  // Fallback to a generic page text search if the entry locator did not return elements yet.
  await expect(page.getByText(normalizedFileName)).toHaveCount(count, {
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
    const normalizedFileName = normalizeUploadedFileName(fileName);
    await expect(
      page
        .locator('[data-testid="file-input-existing-files"]')
        .locator(`text=${normalizedFileName}`),
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
 * Assert that the resolved file input is visible.
 */
export async function assertFileInputVisible(
  page: Page,
  fileInputTarget: FileInputTarget = "file-input-input",
): Promise<void> {
  await expect(
    resolveFileInputWrapperLocator(page, fileInputTarget),
  ).toBeVisible({
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
  await expect(
    resolveFileInputWrapperLocator(page, fileInputTarget),
  ).not.toBeVisible({
    timeout: 30000,
  });
}

/**
 * Wait until a retry/failure control becomes visible after a failed upload.
 *
 * The retry control may be the visible file input wrapper, a dismiss button,
 * a cancel button, or a "choose from folder" prompt.
 */
async function assertRetryControlVisible(
  page: Page,
  fileInputTarget: FileInputTarget = "file-input-input",
  timeoutMs = 30000,
): Promise<void> {
  const fileInputWrapper = resolveFileInputWrapperLocator(
    page,
    fileInputTarget,
  );
  const dismissButton = page.getByRole("button", { name: /dismiss/i }).first();
  const cancelButton = page.getByRole("button", { name: /cancel/i }).first();
  const chooseFromFolder = page.getByText(/choose from folder/i).first();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (
      (await fileInputWrapper.count()) > 0 &&
      (await fileInputWrapper.isVisible())
    ) {
      return;
    }

    if (
      (await dismissButton.count()) > 0 &&
      (await dismissButton.isVisible())
    ) {
      return;
    }

    if ((await cancelButton.count()) > 0 && (await cancelButton.isVisible())) {
      return;
    }

    if (
      (await chooseFromFolder.count()) > 0 &&
      (await chooseFromFolder.isVisible())
    ) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(
    "Expected a retry control to be visible after upload failure: visible file input wrapper, 'Dismiss' button, 'Cancel' button, or 'choose from folder' text.",
  );
}

export type AssertUploadDidNotSaveOptions = {
  assertInputVisible?: boolean;
};

export async function assertUploadDidNotSave(
  page: Page,
  fileName: string,
  expectedCount: number,
  fileInputTarget: FileInputTarget = "file-input-input",
  options: AssertUploadDidNotSaveOptions = {},
): Promise<void> {
  const entryLocator = page
    .locator('[data-testid="file-input-existing-files"]')
    .locator(`text=${fileName}`);

  await expect(entryLocator).toHaveCount(expectedCount, {
    timeout: 60000,
  });

  if (expectedCount === 0 && options.assertInputVisible !== false) {
    await assertRetryControlVisible(page, fileInputTarget);
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
 * Wait for a standard upload progress status message to appear.
 *
 * This checks for the common streamed upload states used by the attachment
 * form upload flow.
 */
export async function expectUploadProgressStatusMessage(
  page: Page,
  timeoutMs = 30000,
): Promise<void> {
  await expectUploadStatusMessage(
    page,
    /(Processing file|Queued|Uploading\.{3}|Upload complete\. Starting security scan|Upload complete\. Running security scan\.{3}|Scan complete)/i,
    timeoutMs,
  );
}

/**
 * Wait for the attachment save POST response after upload completion.
 */
export async function waitForAttachmentSaveResponse(
  page: Page,
  timeoutMs = 30000,
): Promise<Response> {
  return await page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/applications/") &&
      response.url().includes("/attachments") &&
      response.status() === 200,
    { timeout: timeoutMs },
  );
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
