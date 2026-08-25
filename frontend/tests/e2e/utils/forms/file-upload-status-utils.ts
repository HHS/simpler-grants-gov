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
  await expect(scope.getByTestId("file-input-existing-files")).toContainText(
    fileName,
    { timeout: 30_000 },
  );
  // Check that a delete button exists for this file by verifying the text appears somewhere in the section
  // (Don't require a single button since multiple files may have delete buttons)
  await expect(scope.getByTestId("file-input-existing-files")).toContainText(
    "Delete",
  );
}

/**
 * Verifies that a file upload fails the virus scan and is removed.
 *
 * Optionally verifies the upload progress indicator, confirms the failed
 * security scan message is displayed, and verifies the file does not appear
 * in the existing-files list.
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

  await expect(uploadStatus).toContainText(fileName);
  await expect(uploadStatus).toContainText(
    "Security scan failed. File removed",
  );

  await expect(
    scope.getByTestId("file-input-existing-files"),
  ).not.toContainText(fileName);
}
