import { expect, type Page } from "@playwright/test";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import {
  verifyAlertErrors,
  verifyInlineErrors,
  type FieldError,
} from "tests/e2e/utils/forms/verify-form-errors-utils";

export type FormStatus = "complete" | "incomplete";

// Max attempts and delay for transient network errors (e.g. net::ERR_NETWORK_CHANGED)
// which are common in Codespaces when navigating to staging URLs mid-test.
const NAVIGATION_RETRIES = 3;
const NAVIGATION_RETRY_DELAY_MS = 3000;

/**
 * Navigates to the application landing page.
 * Retries up to NAVIGATION_RETRIES times to handle transient network errors.
 * @param page Playwright Page object
 * @param applicationUrl The application URL to navigate to
 */
async function navigateToApplicationPage(
  page: Page,
  applicationUrl: string,
): Promise<void> {
  let lastError: Error = new Error(
    `navigateToApplicationPage: all ${NAVIGATION_RETRIES} attempts failed for ${applicationUrl}`,
  );
  for (let attempt = 1; attempt <= NAVIGATION_RETRIES; attempt++) {
    try {
      await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(10000);
      return; // success — exit retry loop
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(
        `navigateToApplicationPage: attempt ${attempt}/${NAVIGATION_RETRIES} failed — ${lastError.message}`,
      );
      if (attempt < NAVIGATION_RETRIES) {
        await page.waitForTimeout(NAVIGATION_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
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
  const text = formRow.getByText(statusPattern);
  await expect(text).toBeVisible({
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
  await navigateToApplicationPage(page, applicationUrl);
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
    // On form page — check success alert
    const alert = page.getByTestId("alert");
    await expect(alert.locator(".usa-alert__heading")).toContainText(
      FORM_DEFAULTS.formSavedHeading,
    );
    await expect(alert.locator(".usa-alert__text")).toContainText(
      FORM_DEFAULTS.noErrorsText,
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
}
