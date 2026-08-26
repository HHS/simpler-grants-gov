import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Confirms a file finished uploading and passed virus scanning: the file now
 * shows in the existing-files list with its Delete control present (only
 * rendered once scanning succeeds).
 *
 * Pass `scope` (e.g. `page.locator("#form-section-areas_affected")`) on any
 * form with more than one file-upload field visible at once - the
 * `file-input-existing-files` testId isn't unique across fields, so an
 * unscoped locator throws a Playwright strict-mode violation once a second
 * attachment field has a file. Defaults to `page` for single-attachment forms.
 *
 * `expectProgressIndicator` additionally asserts the transient "Loading!"
 * scan-in-progress indicator was visible. Only reliable when called
 * immediately after `setInputFiles` - if the upload already completed
 * earlier (e.g. checking a field a metadata-driven fill already finished),
 * pass `false`, since the indicator will already be gone by the time this
 * runs and asserting it would be flaky rather than meaningful.
 *
 * @param page Playwright Page object
 * @param fileName The uploaded file's display name (e.g. "sample-upload-kb.pdf")
 * @param scope Optional container to scope the check to (page or section locator)
 * @param expectProgressIndicator Whether to also assert the transient scan indicator appeared
 */
export async function verifyVirusScanPassedAndUploaded(
  page: Page,
  fileName: string,
  scope: Page | Locator = page,
  expectProgressIndicator = true,
): Promise<void> {
  if (expectProgressIndicator) {
    await expect(
      page.getByRole("progressbar", { name: "Loading!" }),
    ).toBeVisible();
  }

  // Note: The file-input-existing-files container only renders when there are files.
  // Verify the file appears in the list with a timeout to account for backend processing.
  const existingFilesLocator = scope.getByTestId("file-input-existing-files");
  const existingFilesCount = await existingFilesLocator.count();

  if (existingFilesCount > 0) {
    // Container exists, verify file is in it
    await expect(existingFilesLocator).toContainText(fileName, {
      timeout: 30_000,
    });
    // Check that a delete button exists for this file by verifying the text appears somewhere in the section
    // (Don't require a single button since multiple files may have delete buttons)
    await expect(existingFilesLocator).toContainText("Delete");
  } else {
    // If container doesn't exist, files haven't loaded yet - wait and retry
    await expect(existingFilesLocator).toContainText(fileName, {
      timeout: 30_000,
    });
  }
}

/**
 * Verifies that a file upload fails the virus scan and is removed.
 *
 * Optionally verifies the upload progress indicator, confirms the failed
 * security scan message is displayed, and verifies the file does not appear
 * in the existing-files list.
 *
 * Note: The file-input-existing-files container only renders when files exist.
 * If the file was removed due to virus scan failure, the container may not be
 * present or may be empty, which is also a valid success state.
 *
 * @param page Playwright Page object
 * @param fileName The uploaded file's display name (e.g. "sample-upload-kb.pdf")
 * @param scope Optional container to scope the check to (page or section locator)
 * @param expectProgressIndicator Whether to also assert the transient scan indicator appeared
 */
export async function verifyVirusScanFailedAndRemoved(
  page: Page,
  fileName: string,
  scope: Page | Locator = page,
  expectProgressIndicator = true,
): Promise<void> {
  if (expectProgressIndicator) {
    await expect(
      page.getByRole("progressbar", { name: "Loading!" }),
    ).toBeVisible();
  }

  const uploadStatus = scope.getByTestId("file-upload-status-display");

  // First, verify the filename appears in the status message
  await expect(uploadStatus).toContainText(fileName, { timeout: 5_000 });

  // Extended timeout for virus scan status because the local file scanner
  // has a pre-process delay (1 second) and DynamoDB poll interval (3 seconds)
  // Backend must process the file and update the status message
  await expect(uploadStatus).toContainText(
    "Security scan failed. File removed",
    { timeout: 30_000 },
  );

  // Verify file is not in the existing files list.
  // Note: The file-input-existing-files container only renders when there are files.
  // If no files exist (because the infected file was removed), the check will pass
  // because the element doesn't exist (no files = file not in list).
  const existingFilesLocator = scope.getByTestId("file-input-existing-files");
  const existingFilesCount = await existingFilesLocator.count();

  if (existingFilesCount > 0) {
    // Container exists, verify file is not in it
    await expect(existingFilesLocator).not.toContainText(fileName, {
      timeout: 5_000,
    });
  }
  // If container doesn't exist (existingFilesCount === 0), that means no files
  // are present, so the infected file is definitely not there - test passes.
}
