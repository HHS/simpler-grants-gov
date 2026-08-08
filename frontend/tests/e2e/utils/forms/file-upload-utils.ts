import path from "path";
import {
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";

export const TEST_UPLOAD_DIR = path.resolve(
  __dirname,
  "../../test-upload-files",
);

export async function openApplicationForm(
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

export async function uploadFile(
  page: Page,
  filePath: string | string[],
  fileInputTestId = "file-input-input",
): Promise<void> {
  const fileInput = page.getByTestId(fileInputTestId).first();
  await fileInput.waitFor({ state: "visible", timeout: 30000 });
  await fileInput.setInputFiles(filePath);
}

export async function uploadFileBySelector(
  page: Page,
  selector: string,
  filePath: string | string[],
): Promise<void> {
  const fileInput = page.locator(selector).first();
  await fileInput.waitFor({ state: "visible", timeout: 30000 });
  await fileInput.setInputFiles(filePath);
}

export async function expectUploadedFileVisible(
  page: Page,
  fileName: string,
  timeoutMs = 60000,
): Promise<void> {
  await expect(page.getByText(fileName).first()).toBeVisible({
    timeout: timeoutMs,
  });
}

export async function deleteUploadedFile(
  page: Page,
  fileName?: string,
): Promise<void> {
  const deleteButton = page.getByRole("button", { name: /delete/i }).first();
  await deleteButton.click();

  const confirmDeleteButton = page
    .getByRole("button", {
      name: /delete file/i,
    })
    .first();
  await expect(confirmDeleteButton).toBeVisible({ timeout: 30000 });
  await confirmDeleteButton.click();

  if (fileName) {
    await expect(page.locator(`text=${fileName}`)).toHaveCount(0, {
      timeout: 60000,
    });
  }
}

export async function assertFileInputVisible(
  page: Page,
  fileInputTestId = "file-input-input",
): Promise<void> {
  await expect(page.getByTestId(fileInputTestId).first()).toBeVisible({
    timeout: 30000,
  });
}

export async function assertFileInputHidden(
  page: Page,
  fileInputTestId = "file-input-input",
): Promise<void> {
  await expect(page.getByTestId(fileInputTestId).first()).not.toBeVisible({
    timeout: 30000,
  });
}

export async function expectUploadStatusMessage(
  page: Page,
  message: string | RegExp,
  timeoutMs = 30000,
): Promise<void> {
  await expect(
    page.getByTestId("file-upload-status-display").first(),
  ).toContainText(message, { timeout: timeoutMs });
}

export async function delayAttachmentUploadRequest(
  page: Page,
  delayMs = 1500,
): Promise<void> {
  await page.route("**/api/applications/*/attachments", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function abortAttachmentUploadRequest(page: Page): Promise<void> {
  await page.route("**/api/applications/*/attachments", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.abort();
  });
}
