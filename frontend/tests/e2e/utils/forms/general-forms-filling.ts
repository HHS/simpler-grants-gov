/**
 * Generic form-filling helpers that open forms, fill fields, and save when needed.
 * Usage: import { fillField, fillFormPartial, fillForm } from "tests/e2e/utils/forms/general-forms-filling";
 */

import { Page, TestInfo } from "@playwright/test";
import { runSharedFieldFill } from "tests/e2e/utils/common/index";
import {
  shouldFillField,
  type FillFieldDefinition,
  type FillFormConfig,
  type FormFillFieldDefinitions,
} from "tests/e2e/utils/common/types";

import { buildFlexibleFormNameRegex, openForm } from "./form-navigation-utils";
import { clickSaveButton } from "./save-form-utils";

type FillFieldOptions = {
  fieldContextLabel?: string;
};

/** Fills one field using the shared field-fill execution path. */
export async function fillField(
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
  options?: FillFieldOptions,
): Promise<void> {
  await runSharedFieldFill({
    page,
    field,
    data,
    fieldContextLabel: options?.fieldContextLabel,
  });
}
/**
 * Fills a subset of fields on the current form page without navigating or saving.
 * Use when the form is already open and only some fields should be filled
 * (e.g. failure-path tests that intentionally leave required fields empty).
 * Does NOT perform assertions - those are done in the test.
 */
export async function fillFormPartial(
  testInfo: TestInfo,
  page: Page,
  fieldDefinitions: FormFillFieldDefinitions,
  data: Record<string, string | boolean>,
): Promise<void> {
  for (const key of Object.keys(data)) {
    const fieldDef = fieldDefinitions[key as keyof FormFillFieldDefinitions];
    if (!fieldDef) {
      await testInfo.attach(`fillFormPartial-${key}-unknown-key`, {
        body: `Skipped ${key}: no matching field definition found`,
        contentType: "text/plain",
      });
      continue;
    }

    await fillField(page, fieldDef, data[key]);
  }
}
/**
 * Opens and fills a form from the application page, then saves it.
 * Delegates navigation to `openForm`, which owns all navigation reliability:
 * table-scoped row lookup, scroll-to-reveal, testId/href/button/global
 * fallback selectors, trial-click check, force-click retry, direct href
 * goto last resort, and URL pattern + load-state verification.
 *
 * Does NOT perform assertions - those are done in the test.
 * Assumes the current page is already an application page where the forms
 * table is reachable.
 */
export async function fillForm(
  testInfo: TestInfo,
  page: Page,
  config: FillFormConfig,
  data: Record<string, string | boolean>,
  returnToApplication = true,
): Promise<void> {
  const { formName, fields, saveButtonTestId } = config;
  const applicationURL = page.url();
  await testInfo.attach("fillForm-applicationURL", {
    body: `Application URL: ${applicationURL}`,
    contentType: "text/plain",
  });
  // Derive a regex matcher for openForm. For plain strings (e.g. "SF-424 (Form)"),
  // use buildFlexibleFormNameRegex so special chars like () are properly escaped
  // and hyphens/spaces become flexible. For RegExp formNames, pass through directly.
  const formMatcher =
    formName instanceof RegExp
      ? formName
      : buildFlexibleFormNameRegex(formName);
  try {
    // Navigation:
    // Delegate to openForm, which owns all navigation reliability:
    // table-scoped row lookup, scroll-to-reveal, testId/href/button/global
    // fallback selectors, trial-click check, force-click retry, direct href
    // goto last resort, and URL pattern + load-state verification.
    const opened = await openForm(page, formMatcher);
    if (!opened) {
      throw new Error(`Could not find or open form: ${formMatcher}`);
    }
    // Form ready check:
    // Confirm the form heading is visible before filling any fields.
    // Use buildFlexibleFormNameRegex for plain strings so special chars (parens,
    // hyphens) are properly escaped rather than treated as regex syntax.
    const formReadyMatcher =
      formName instanceof RegExp
        ? formName
        : buildFlexibleFormNameRegex(formName);
    await page
      .getByText(formReadyMatcher)
      .first()
      .waitFor({ state: "visible", timeout: 35000 });
    for (const [fieldIdentifier, fieldConfig] of Object.entries(fields)) {
      // Fill fields:
      const dataForField = data[fieldIdentifier];
      if (dataForField === undefined) {
        continue;
      }
      if (!shouldFillField(fieldConfig, data)) {
        await testInfo.attach(`fillField-${fieldIdentifier}-skipped`, {
          body: `Skipped ${fieldIdentifier}: dependency ${fieldConfig.dependsOn?.field} did not match ${fieldConfig.dependsOn?.value}`,
          contentType: "text/plain",
        });
        continue;
      }
      await fillField(page, fieldConfig, dataForField);
    }

    // Run form-specific pre-save hook if defined.
    // Optional - existing forms without this property are unaffected.
    if (config.beforeSave) {
      await config.beforeSave(page);
    }
    await clickSaveButton(page, saveButtonTestId);
    if (returnToApplication) {
      await page.goto(applicationURL);
    }
  } catch (error) {
    await testInfo.attach("fillForm-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    throw error;
  }
}
