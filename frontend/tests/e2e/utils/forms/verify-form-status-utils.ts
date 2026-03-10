import { expect, type Page } from "@playwright/test";
import {
  verifyAlertErrors,
  verifyInlineErrors,
  type FieldError,
} from "tests/e2e/utils/forms/verify-form-errors-utils";

export type FormStatus = "complete" | "incomplete";

/**
 * Navigates to the application landing page.
 * Uses goto if applicationUrl is provided, otherwise falls back to goBack.
 * @param page Playwright Page object
 * @param applicationUrl The application URL to navigate to
 */
async function navigateToApplicationPage(
  page: Page,
  applicationUrl: string,
): Promise<void> {
  if (applicationUrl) {
    await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
  } else {
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
  }
  await page.waitForTimeout(10000);
}

/**
 * Verifies the form row status in the table on the application landing page.
 * Assumes navigation to the application page has already occurred.
 * @param page Playwright Page object
 * @param status Expected status: "complete" (No issues detected) or "incomplete" (Some issues found)
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 */
export async function assertFormRowStatus(
  page: Page,
  status: FormStatus,
  formName: string,
): Promise<void> {
  // Scroll down to find form row in the table
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);

  const escapedFormName = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexiblePattern = escapedFormName
    .replace(/\s+/g, "\\s*")
    // be tolerant of SF-424B vs SF424B text variants
    .replace(/-/g, "-?");
  const formRow = page
    .locator("tr", {
      hasText: new RegExp(flexiblePattern, "i"),
    })
    .filter({
      has: page.locator('a[href*="/form/"]'),
    });

  await expect(formRow).toBeVisible({ timeout: 10000 });

  const statusPattern =
    status === "complete"
      ? /no issues detected\.?|complete/i
      : /some issues found\.?|in progress/i;

  await expect(formRow.getByText(statusPattern)).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Navigates to the application landing page and verifies the form row status.
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
  await navigateToApplicationPage(page, applicationUrl);
  await assertFormRowStatus(page, status, formName);
}

/**
 * Verifies the post-save state on the form page, then navigates to the application
 * landing page and verifies the form row status.
 *
 * For "complete": checks success alert on form page, then verifies "no issues detected" in form row.
 * For "incomplete": checks error alert and inline errors on form page, then verifies "some issues found" in form row.
 *
 * @param page Playwright Page object
 * @param status Expected status: "complete" or "incomplete"
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 * @param applicationUrl The application URL to navigate to
 * @param expectedErrors Required when status is "incomplete" — list of field errors to verify
 */
export async function verifyFormStatusAfterSave(
  page: Page,
  status: FormStatus,
  formName: string,
  applicationUrl: string,
  expectedErrors?: FieldError[],
): Promise<void> {
  if (status === "complete") {
    // On form page — check success alert
    const alert = page.getByTestId("alert");
    await expect(alert.locator(".usa-alert__heading")).toContainText(
      "Form was saved",
    );
    await expect(alert.locator(".usa-alert__text")).toContainText(
      "No errors were detected.",
    );
  } else if (status === "incomplete") {
    // On form page — check error alert list
    if (!expectedErrors?.length) {
      throw new Error(
        "expectedErrors must be provided when status is 'incomplete'",
      );
    }
    // On form page — check error alert list at top
    await verifyAlertErrors(page, expectedErrors);

    // On form page — scroll down and check inline field errors
    await verifyInlineErrors(page, expectedErrors);
  }

  // Navigate to application landing page
  await navigateToApplicationPage(page, applicationUrl);

  // On application page — verify form row status
  await assertFormRowStatus(page, status, formName);
}
