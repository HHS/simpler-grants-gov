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
