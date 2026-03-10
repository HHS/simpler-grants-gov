import { expect, type Page } from "@playwright/test";

export interface FieldError {
  fieldId: string;
  message: string;
}

/**
 * Verifies error messages appear in the top alert list on the form page after save.
 * Assumes navigation to the form page has already occurred.
 * @param page Playwright Page object
 * @param expectedErrors List of field errors to verify in the alert list
 */
export async function verifyAlertErrors(
  page: Page,
  expectedErrors: FieldError[],
): Promise<void> {
  const alertList = page.getByTestId("alert").getByRole("list");
  for (const { message } of expectedErrors) {
    await expect(alertList).toContainText(message);
  }
}

/**
 * Scrolls down on the form page and verifies inline field-level error messages.
 * Assumes navigation to the form page has already occurred.
 * @param page Playwright Page object
 * @param expectedErrors List of field errors to verify inline on the form
 */
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
