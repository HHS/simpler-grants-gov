import { expect, Page } from "@playwright/test";

/**
 * Clicks the save button and verifies form save success.
 * @param page Playwright Page object
 */
export async function saveForm(page: Page) {
  const saveButton = page.getByRole("button", { name: /save/i }).first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/form was saved/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/no errors were detected/i)).toBeVisible({
      timeout: 10000,
    });
  }
}
