import { expect, Page } from "@playwright/test";

export type FormStatus = "complete" | "incomplete";

/**
 * Navigate to the application page and verify the status message for a specific form row in the table.
 * Scrolls down to locate the form row.
 * @param page Playwright Page object
 * @param status Expected status: "complete" (No issues detected) or "incomplete" (Some issues found)
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 * @param applicationUrl The application URL to navigate to
 */
export async function verifyFormStatusOnPage(
  page: Page,
  status: FormStatus,
  formName: string,
  applicationUrl: string,
): Promise<void> {
  await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);

  // Scroll down to find form row in the table
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);

  const escapedFormName = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexiblePattern = escapedFormName.replace(/\s+/g, "\\s*");
  const formRow = page
    .locator("tr", { hasText: new RegExp(flexiblePattern, "i") })
    .filter({ has: page.locator('a[href*="/form/"]') });

  await expect(formRow).toBeVisible({ timeout: 10000 });

  const statusPattern =
    status === "complete" ? /no issues detected/i : /some issues found/i;

  await expect(formRow.getByText(statusPattern)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Navigate to the application page and verify the top-level alert status for a specific form.
 * Scrolls up to locate the alert/banner message.
 * @param page Playwright Page object
 * @param status Expected status: "complete" (No issues detected) or "incomplete" (Some issues found)
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 * @param applicationUrl The application URL to navigate to
 */
export async function verifyFormStatusAfterSave(
  page: Page,
  status: FormStatus,
  formName: string,
  applicationUrl: string,
): Promise<void> {
  await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);

  // Scroll up to find the alert/banner message at the top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(5000);

  await verifyFormStatusOnPage(page, status, formName, applicationUrl);
}
