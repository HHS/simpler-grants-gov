import { expect, type Page } from "@playwright/test";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import {
  verifyAlertErrors,
  verifyInlineErrors,
  type FieldError,
} from "tests/e2e/utils/forms/verify-form-errors-utils";
import { gotoWithRetry } from "tests/e2e/utils/lifecycle-utils";

export type FormStatus = "complete" | "incomplete";

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
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);

  const escapedFormName = formName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexiblePattern = escapedFormName
    .replace(/\s+/g, "\\s*")
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
 * @param status Expected status: "complete" or "incomplete"
 * @param formName The form name to verify status for (e.g., "SF-424B", "SF-LLL")
 * @param applicationUrl The application URL to navigate to
 */
export async function verifyFormStatusOnApplication(
  page: Page,
  status: FormStatus,
  formName: string,
  applicationUrl: string,
): Promise<void> {
  await gotoWithRetry(page, applicationUrl, { waitUntil: "domcontentloaded" });
  // Wait for the forms table to be populated before asserting row status.
  // domcontentloaded fires before async data is fetched; this replaces the
  // old static 10s wait with a dynamic wait that is both faster on fast
  // machines and more reliable on slow ones (e.g. Mobile Chrome in CI).
  await page
    .locator('a[href*="/form/"]')
    .first()
    .waitFor({ state: "visible", timeout: 30000 });
  await assertFormRowStatus(page, status, formName);
}

/**
 * Verifies the post-save state on the form page (success alert or error alerts +
 * inline errors). Does NOT navigate — assumes the form page is currently active.
 *
 * For "complete": checks success alert heading and "No errors were detected." text.
 * For "incomplete": checks the alert error list at the top and inline field errors;
 *                   `expectedErrors` is required in this case.
 *
 * @param page Playwright Page object
 * @param status Expected status: "complete" or "incomplete"
 * @param expectedErrors Required when status is "incomplete" — list of field errors to verify
 */
export async function verifyFormStatusAfterSave(
  page: Page,
  status: FormStatus,
  expectedErrors?: FieldError[],
): Promise<void> {
  if (status === "complete") {
    const alert = page.getByTestId("alert");
    // Use a generous timeout: Webkit renders the save-confirmation alert more
    // slowly than Chrome/Firefox, and the Playwright default (5000ms) is
    // insufficient on some CI runners.
    await expect(alert).toBeVisible({ timeout: 30000 });
    await expect(alert.locator(".usa-alert__heading")).toContainText(
      FORM_DEFAULTS.formSavedHeading,
      { timeout: 15000 },
    );
    await expect(alert.locator(".usa-alert__text")).toContainText(
      FORM_DEFAULTS.noErrorsText,
      { timeout: 15000 },
    );
  } else {
    if (!expectedErrors?.length) {
      throw new Error(
        "expectedErrors must be provided when status is 'incomplete'",
      );
    }
    await verifyAlertErrors(page, expectedErrors);
    await verifyInlineErrors(page, expectedErrors);
  }
}
