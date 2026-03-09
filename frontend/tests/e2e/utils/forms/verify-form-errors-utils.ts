import { expect, type Page } from "@playwright/test";

interface FieldError {
  fieldId: string;
  message: string;
}

export async function verifyAlertErrors(
  page: Page,
  expectedErrors: FieldError[],
): Promise<void> {
  const alertList = page.getByTestId("alert").getByRole("list");
  for (const { message } of expectedErrors) {
    await expect(alertList).toContainText(message);
  }
}

export async function verifyInlineErrors(
  page: Page,
  expectedErrors: FieldError[],
): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  for (const { fieldId, message } of expectedErrors) {
    const errorLocator = page.locator(`#error-for-${fieldId}`);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText(message);
  }
}
