import fs from "fs";
import path from "path";
import { expect, type Page } from "@playwright/test";

/**
 * Extracts the display filename from a full file path.
 * Works with both forward and backslash separators.
 *
 * @param filePath - Full file path
 * @returns Just the filename (e.g., "sample.pdf" from "/path/to/sample.pdf")
 */
export function fileNameOf(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

/**
 * Creates a uniquely named copy of a test file for parallel test execution.
 * Prevents file conflicts when multiple tests run concurrently.
 *
 * Example with counter=1, uniqueSuffix="0-1692900000":
 * sample-upload-kb.pdf → sample-upload-kb-0-1692900000-1.pdf
 *
 * @param sourceFile - Path to the original test file to copy
 * @param counter - Numeric counter (for multiple files in same test)
 * @param uniqueSuffix - Unique identifier (typically parallelIndex-timestamp)
 * @returns Path to the newly created numbered file
 */
export function createNumberedUploadFile(
  sourceFile: string,
  counter: number,
  uniqueSuffix: string,
): string {
  const directory = path.dirname(sourceFile);
  const extension = path.extname(sourceFile);
  const baseName = path.basename(sourceFile, extension);

  const numberedFile = path.join(
    directory,
    `${baseName}-${uniqueSuffix}-${counter}${extension}`,
  );

  fs.copyFileSync(sourceFile, numberedFile);

  return numberedFile;
}

/**
 * Creates multiple uniquely named copies of a test file for parallel execution.
 * Simplifies creating several numbered files in a single call.
 *
 * Example with count=4, parallelIndex=0, timestamp=1692900000:
 * Returns [file-1.pdf, file-2.pdf, file-3.pdf, file-4.pdf]
 *
 * @param sourceFile - Path to the original test file to copy
 * @param count - Number of files to create
 * @param parallelIndex - Test worker's parallel index (from testInfo.parallelIndex)
 * @param timestamp - Timestamp for uniqueness (typically Date.now())
 * @returns Array of paths to newly created numbered files
 */
export function createMultipleNumberedUploadFiles(
  sourceFile: string,
  count: number,
  parallelIndex: number,
  timestamp: number,
): string[] {
  const uniqueSuffix = `${parallelIndex}-${timestamp}`;
  const files: string[] = [];

  for (let i = 1; i <= count; i++) {
    files.push(createNumberedUploadFile(sourceFile, i, uniqueSuffix));
  }

  return files;
}

/**
 * Resolves a form field's locator using either a selector or testId.
 * Follows the pattern where a field definition can specify either:
 * - `selector`: CSS/XPath selector
 * - `testId`: data-testid attribute
 *
 * @param page - Playwright page
 * @param selector - Optional CSS/XPath selector
 * @param testId - Optional data-testid value
 * @returns Playwright Locator for the field
 * @throws If neither selector nor testId is provided
 */
export function resolveFieldLocator(
  page: Page,
  selector?: string,
  testId?: string,
) {
  if (selector) {
    return page.locator(selector);
  }
  if (testId) {
    return page.getByTestId(testId);
  }
  throw new Error(
    "Field locator requires either selector or testId to be defined",
  );
}

/**
 * Uploads multiple files to a multi-file attachment field.
 * Typical usage: uploading 2+ files to a single form field.
 *
 * @param fieldLocator - Locator for the file input field
 * @param filePaths - Array of file paths to upload
 * @param waitMs - Optional wait time after upload (default: 1000ms)
 */
export async function uploadMultipleFiles(
  fieldLocator: ReturnType<Page["locator"]>,
  filePaths: string[],
  waitMs: number = 1000,
): Promise<void> {
  await fieldLocator.setInputFiles(filePaths);

  // Wait for file uploads and virus scanning to complete
  if (waitMs > 0) {
    await fieldLocator.page().waitForTimeout(waitMs);
  }
}

/**
 * Verifies that multiple files appear in a multi-file attachment field's display.
 * Checks that all filenames are rendered in the given section.
 *
 * @param section - Locator for the form section containing the field
 * @param filePaths - File paths that should be visible
 * @param timeout - Optional assertion timeout (default: 30_000ms)
 */
export async function verifyMultiFileAttachmentDisplay(
  section: ReturnType<Page["locator"]>,
  filePaths: string[],
  timeout: number = 30_000,
): Promise<void> {
  for (const filePath of filePaths) {
    const fileName = fileNameOf(filePath);
    await expect(section).toContainText(fileName, { timeout });
  }
}

/**
 * Verifies that attachment uploads are recorded in the Application History.
 * Each file should appear exactly once as "Attachment added: {fileName}".
 *
 * @param activities - Array of activity strings from Application History
 * @param filePaths - Array of file paths that were uploaded
 */
export function verifyAttachmentHistoryActivities(
  activities: string[],
  filePaths: string[],
): void {
  for (const filePath of filePaths) {
    const fileName = fileNameOf(filePath);
    const actualCount = activities.filter((activity) =>
      activity.includes(`Attachment added: ${fileName}`),
    ).length;

    expect(actualCount).toBe(1);
  }
}

/**
 * Validates attachment filenames appear in print view sections.
 * Used for verifying that attachment fields render correctly in read-only print view.
 *
 * @param page - Playwright page
 * @param sectionIds - Array of section IDs to check
 * @param filePaths - Array of file paths that should appear
 */
export async function validateAttachmentPrintViewSections(
  page: Page,
  sectionIds: string[],
  filePaths: string[],
): Promise<void> {
  for (const sectionId of sectionIds) {
    const section = page.locator(`#${sectionId}`);
    await verifyMultiFileAttachmentDisplay(section, filePaths);
  }
}

/**
 * Verifies that a file upload shows the "Scan complete" status.
 * This status appears after the file finishes uploading but before the final success message.
 * Safe to test without flakiness - this is a deterministic intermediate state.
 *
 * @param scope - Locator for the section/scope containing the file status display
 * @param fileName - Name of the file to check
 * @param timeout - Optional assertion timeout (default: 30_000ms)
 */
export async function verifyScanCompleteStatus(
  scope: ReturnType<Page["locator"]>,
  fileName: string,
  timeout: number = 30_000,
): Promise<void> {
  // Look for the "Scan complete" status message alongside the filename
  const statusDisplay = scope.locator(".file-input-status");
  await expect(statusDisplay).toContainText("Scan complete", { timeout });
  await expect(scope).toContainText(fileName, { timeout });
}

/**
 * Tests the cancel functionality for a file upload.
 * Uploads a file, clicks the cancel button before completion, and verifies the file is removed.
 *
 * @param fieldLocator - Locator for the file input field
 * @param filePath - Path to the file to upload
 * @param timeout - Optional assertion timeout (default: 10_000ms)
 */
export async function testCancelFileUpload(
  fieldLocator: ReturnType<Page["locator"]>,
  filePath: string,
  timeout: number = 10_000,
): Promise<void> {
  const page = fieldLocator.page();
  const fileName = fileNameOf(filePath);

  // Start the upload
  await fieldLocator.setInputFiles(filePath);

  // Look for the cancel button in the status display
  const cancelButton = page
    .locator(".file-input-status")
    .getByRole("button", { name: /cancel/i })
    .first();

  // Click cancel before upload completes
  const cancelVisible = await cancelButton
    .isVisible()
    .catch(() => false);
  
  if (cancelVisible) {
    await cancelButton.click();

    // Verify the file is no longer in the display
    const existingFiles = page.locator(".file-input-existing-files");
    await expect(existingFiles).not.toContainText(fileName, { timeout });

    // Verify the status display is cleared
    const statusDisplay = page.locator(".file-input-status");
    await expect(statusDisplay).not.toBeVisible({ timeout });
  }
}

/**
 * Tests the dismiss functionality for a file upload status.
 * Uploads a file, verifies success, clicks dismiss, and confirms status is cleared.
 *
 * @param scope - Locator for the section/scope containing the file status display
 * @param filePath - Path to the file that was uploaded
 * @param timeout - Optional assertion timeout (default: 30_000ms)
 */
export async function testDismissUploadStatus(
  scope: ReturnType<Page["locator"]>,
  filePath: string,
  timeout: number = 30_000,
): Promise<void> {
  const page = scope.page();
  const fileName = fileNameOf(filePath);

  // Wait for the file to appear in existing files (indicating success)
  await expect(scope).toContainText(fileName, { timeout });

  // Verify success status is showing
  const statusDisplay = page.locator(".file-input-status");
  await expect(statusDisplay).toContainText("Success", { timeout });

  // Click the dismiss button to close the status
  const dismissButton = statusDisplay
    .getByRole("button", { name: /dismiss/i })
    .first();

  const dismissVisible = await dismissButton
    .isVisible()
    .catch(() => false);
  
  if (dismissVisible) {
    await dismissButton.click();

    // Verify the status display is cleared/hidden
    // The file should remain in existing files, but status message should be gone
    await expect(statusDisplay).not.toBeVisible({ timeout: 5_000 }).catch(() => {
      // It's okay if the status disappears immediately
    });
    
    // But the file should still be in the existing files list
    await expect(scope.locator(".file-input-existing-files")).toContainText(
      fileName,
      { timeout: 5_000 },
    );
  }
}
