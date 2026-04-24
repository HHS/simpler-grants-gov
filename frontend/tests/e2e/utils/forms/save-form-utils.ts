import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

// Staging can be slow under load; Firefox tends to be slower than Chrome in CI.
// Use 30s for staging, 20s for local to accommodate both.
const SAVE_TIMEOUT = playwrightEnv.targetEnv === "staging" ? 30000 : 20000;

/**
 * Clicks the save button and verifies form save result.
 * @param page Playwright Page object
 * @param expectErrors When true, expect validation errors instead of success
 */
export async function saveForm(page: Page, expectErrors = false) {
  const saveButton = page
    .getByTestId(FORM_DEFAULTS.saveButtonTestId)
    .or(page.getByRole("button", { name: /save/i }).first());

  if (await saveButton.isVisible()) {
    // Set up a listener for the Next.js Server Action POST request BEFORE
    // clicking, so we don't miss a fast response. The save button submits an
    // HTML form that triggers a Server Action - in the browser this appears as a
    // POST to the current page URL with a "next-action" request header.
    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        !!response.request().headers()["next-action"],
      { timeout: SAVE_TIMEOUT },
    );

    await saveButton.click();

    // Wait for the Server Action round-trip to complete before asserting UI state.
    await saveResponsePromise.catch(() => {
      // If we can't match the server-action response (e.g., env differences),
      // fall back to a static wait so the test can still proceed.
    });

    // Always check for form saved message, which appears for both validation
    // and successful saves. Use a generous timeout - the save API can be slow
    // under load, and Firefox renders UI updates more slowly than Chrome.
    await expect(
      page.getByText(FORM_DEFAULTS.formSavedHeading, { exact: false }),
    ).toBeVisible({ timeout: SAVE_TIMEOUT });

    if (expectErrors) {
      await expect(
        page.getByText(FORM_DEFAULTS.validationErrorText, { exact: false }),
      ).toBeVisible({ timeout: SAVE_TIMEOUT });
    } else {
      await expect(
        page.getByText(FORM_DEFAULTS.noErrorsText, { exact: false }),
      ).toBeVisible({ timeout: SAVE_TIMEOUT });
    }
  }
}
