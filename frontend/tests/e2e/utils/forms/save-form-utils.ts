import { expect, Page } from "@playwright/test";

/**
 * Clicks the save button and verifies form save result.
 * @param page Playwright Page object
 * @param expectErrors When true, expect validation errors instead of success
 */
export async function saveForm(page: Page, expectErrors = false) {
  const saveButton = page.getByRole("button", { name: /save/i }).first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(2000);
    if (expectErrors) {
      await expect(page.getByText(/errors were detected/i)).toBeVisible({
        timeout: 10000,
      });
    } else {
      await expect(page.getByText(/form was saved/i)).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/no errors were detected/i)).toBeVisible({
        timeout: 10000,
      });
    }
  }
}
