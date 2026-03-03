import { expect, Page } from "@playwright/test";

/**
 * Verify "No issues detected" status for a specific form row on the application page.
 * @param page Playwright Page object
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 */
export async function verifyFormStatusOnPage(
  page: Page,
  formName: string,
): Promise<void> {
  // Find the row containing the form name and verify it has "No issues detected"
  // Look for the row that contains both the form name AND a link to the form
  const escapedFormName = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexiblePattern = escapedFormName.replace(/\s+/g, "\\s*");
  const formRow = page
    .locator("tr", {
      hasText: new RegExp(flexiblePattern, "i"),
    })
    .filter({
      has: page.locator('a[href*="/form/"]'),
    });

  await expect(formRow).toBeVisible({ timeout: 10000 });
  await expect(formRow.getByText(/no issues detected/i)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Navigate back to application page and verify "No issues detected" status for a form.
 * @param page Playwright Page object
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 */
export async function verifyFormStatusAfterSave(
  page: Page,
  formName: string,
  applicationUrl?: string,
): Promise<void> {
  if (applicationUrl) {
    await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
  } else {
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
  }
  await page.waitForTimeout(10000);

  // Scroll to top to find status message
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(5000);

  await verifyFormStatusOnPage(page, formName);
}
