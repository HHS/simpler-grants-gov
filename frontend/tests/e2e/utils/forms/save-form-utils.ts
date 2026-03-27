import { expect, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

const SAVE_TIMEOUT = playwrightEnv.targetEnv === "staging" ? 30000 : 10000;

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
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Always check for form saved message, which appears for both validation
    // and successful saves. Use a generous timeout on staging — the save API
    // can be slow under load.
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
