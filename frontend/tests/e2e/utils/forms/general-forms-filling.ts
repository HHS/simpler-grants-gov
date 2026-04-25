import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

import { buildFlexibleFormNameRegex, openForm } from "./form-navigation-utils";
import { clickSaveButton } from "./save-form-utils";

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  optionTestIdPrefix?: string;
  hasTextRegex?: string;
  getByText?: string;
  useDataAsText?: boolean;
  textExact?: boolean;
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
  type:
    | "text"
    | "dropdown"
    | "file"
    | "radiobutton"
    | "checkbox"
    | "combo-box-input";
  section?: string;
  field: string;
}

export type FormFillFieldDefinitions = {
  [fieldIdentifier: string]: FillFieldDefinition;
};

export interface FillFormConfig {
  formName: string | RegExp;
  fields: FormFillFieldDefinitions;
  saveButtonTestId: string;
  noErrorsText?: string;
  /**
   * Optional form-specific hook called before the save button is clicked.
   * Use for pre-save interactions that cannot be expressed as a field definition.
   * e.g. SF-424A confirmation checkbox that only appears in this form.
   */
  beforeSave?: (page: Page) => Promise<void>;
}

export interface FormsFixtureData {
  formName: string | RegExp;
  fields: FillFieldDefinition[];
}

/**
 * Determines whether a radio button or checkbox field should be activated (checked/selected) during form filling.
 *
 * Usage:
 * - Used in form automation to decide if a radio or checkbox should be interacted with, based on the provided data value.
 * - Returns true if the data is boolean true, or a string that is not undefined and not equal to "false" (case-insensitive).
 * - Returns false for boolean false, undefined, or the string "false".
 */
function shouldActivateField(data: string | boolean | undefined): boolean {
  if (typeof data === "boolean") {
    return data;
  }

  return data !== undefined && data.toLowerCase() !== "false";
}

function shouldFillField(
  field: FillFieldDefinition,
  formData: Record<string, string | boolean>,
): boolean {
  if (!field.dependsOn) {
    return true;
  }

  return (
    String(formData[field.dependsOn.field]) === String(field.dependsOn.value)
  );
}

export async function fillField(
  testInfo: TestInfo,
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
): Promise<void> {
  const fieldIdentifier = field.section
    ? `${field.section}-${field.field}`
    : field.field;
  try {
    if (data === undefined) {
      await testInfo.attach(`fillField-${fieldIdentifier}-skipped`, {
        body: `Skipped ${fieldIdentifier}: no data provided`,
        contentType: "text/plain",
      });
      return;
    }

    if (
      (field.type === "dropdown" ||
        field.type === "combo-box-input" ||
        field.type === "text" ||
        field.type === "file") &&
      typeof data !== "string"
    ) {
      throw new Error(
        `Field ${fieldIdentifier} requires string data, received ${typeof data}`,
      );
    }
    if (field.type === "dropdown") {
      // Validate data type
      if (typeof data !== "string") {
        throw new Error(
          `Dropdown field ${fieldIdentifier} requires string data, received ${typeof data}`,
        );
      }

      // Handle selector-based dropdown (native <select>)
      if (field.selector) {
        await selectDropdownByValueOrLabel(page, field.selector, data);
        return;
      }

      // Handle testId-based dropdown (custom component)
      if (field.testId) {
        const locator = page.getByTestId(`${field.testId}${data}`);
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
        return;
      }

      // Fail fast if misconfigured
      throw new Error(
        `Dropdown field ${fieldIdentifier} is missing selector or testId`,
      );
    } else if (field.type === "combo-box-input" && field.testId) {
      const toggleLocator = page.getByTestId(field.testId);
      await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
      await toggleLocator.click();

      const optionPrefix = field.optionTestIdPrefix ?? "combo-box-option-";
      const optionLocator = page.getByTestId(`${optionPrefix}${data}`);
      await optionLocator.waitFor({ state: "visible", timeout: 5000 });
      await optionLocator.click();
    } else if (
      field.type === "text" &&
      field.testId &&
      typeof data === "string"
    ) {
      const locator = page.getByTestId(field.testId);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.fill(data);
    } else if (
      field.type === "radiobutton" &&
      (field.testId || field.selector || field.getByText || field.useDataAsText)
    ) {
      // If getByText is specified, the field definition already encodes which
      // specific radio option to click (eg - "No"), so always activate it
      // regardless of the data value. Otherwise, rely on shouldActivateField.
      if (field.getByText !== undefined || shouldActivateField(data)) {
        let locator = field.getByText
          ? page.getByText(field.getByText, {
              exact: field.textExact ?? false,
            })
          : field.selector
            ? page.locator(field.selector)
            : field.testId
              ? page.getByTestId(field.testId)
              : page.getByText(String(data), {
                  exact: field.textExact ?? field.useDataAsText ?? false,
                });
        if (field.hasTextRegex) {
          locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
        }
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
      }
    } else if (
      field.type === "checkbox" &&
      (field.testId || field.selector || field.getByText)
    ) {
      if (shouldActivateField(data)) {
        let locator = field.getByText
          ? page.getByText(field.getByText, {
              exact: field.textExact ?? false,
            })
          : field.selector
            ? page.locator(field.selector)
            : page.getByTestId(field.testId as string);
        if (field.hasTextRegex) {
          locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
        }
        await locator.waitFor({ state: "visible", timeout: 5000 });
        try {
          if (!(await locator.isChecked())) {
            await locator.check();
          }
        } catch {
          const nestedCheckbox = locator
            .locator('input[type="checkbox"]')
            .first();
          if ((await nestedCheckbox.count()) === 0) {
            throw new Error(
              `Checkbox field ${fieldIdentifier} is not checkable; map to the checkbox input testId`,
            );
          }
          if (!(await nestedCheckbox.isChecked())) {
            await nestedCheckbox.check();
          }
        }
      }
    } else if (field.type === "file" && (field.testId || field.selector)) {
      if (typeof data !== "string") {
        throw new Error(
          `File field ${fieldIdentifier} requires string data (file path), received ${typeof data}`,
        );
      }
      const locator = field.selector
        ? page.locator(field.selector)
        : page.getByTestId(field.testId!);
      // Use a generous timeout: Mobile Chrome renders the file input more slowly
      // than desktop Chrome, so 5000ms is insufficient.
      await locator.waitFor({ state: "attached", timeout: 30000 });
      await locator.scrollIntoViewIfNeeded();

      const inputName = await locator.getAttribute("name");
      const inputId = await locator.getAttribute("id");
      const hiddenInputSelector = inputName
        ? `input[type="hidden"][name="${inputName}"]`
        : inputId
          ? `input[type="hidden"][name="${inputId}"], input[type="hidden"]#${inputId}`
          : null;

      await locator.setInputFiles(data);

      const fileName = data.split(/[/\\]/).pop() ?? data;

      // Wait for the uploaded filename to appear in the UI before proceeding.
      // Webkit renders the post-upload filename span more slowly, so use a
      // generous timeout matching the file-input wait above.
      if (hiddenInputSelector) {
        await page
          .locator(hiddenInputSelector)
          .locator(
            "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' usa-form-group ') or contains(concat(' ', normalize-space(@class), ' '), ' simpler-formgroup ')][1]",
          )
          .locator("span")
          .filter({ hasText: fileName })
          .first()
          .waitFor({ state: "visible", timeout: 30000 });
      } else {
        await page
          .locator(`span:has-text("${fileName}")`)
          .waitFor({ state: "visible", timeout: 30000 });
      }

      if (hiddenInputSelector) {
        await page.waitForFunction(
          ({ selector, uploadedFileName }) => {
            const hiddenInput =
              document.querySelector<HTMLInputElement>(selector);

            if (!hiddenInput?.value) {
              return false;
            }

            const fieldContainer =
              hiddenInput.closest(".usa-form-group, .simpler-formgroup") ??
              hiddenInput.parentElement;

            if (!fieldContainer) {
              return false;
            }

            return Array.from(fieldContainer.querySelectorAll("span")).some(
              (span) => span.textContent?.trim() === uploadedFileName,
            );
          },
          { selector: hiddenInputSelector, uploadedFileName: fileName },
          { timeout: 60000 },
        );
      }
    } else {
      throw new Error(
        `Unsupported or invalid field configuration for ${fieldIdentifier}`,
      );
    }

    await testInfo.attach(`fillField-${fieldIdentifier}-success`, {
      body: `Successfully filled ${fieldIdentifier}: "${data}"`,
      contentType: "text/plain",
    });
  } catch (error) {
    await testInfo.attach(`fillField-${fieldIdentifier}-error`, {
      body: `Failed to fill ${fieldIdentifier}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      contentType: "text/plain",
    });

    throw new Error(
      `Failed to fill ${field.field}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
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
    const fieldDef = fieldDefinitions[key];
    if (fieldDef) {
      await fillField(testInfo, page, fieldDef, data[key]);
    }
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
    // ── Navigation ──────────────────────────────────────────────────────────
    // Delegate to openForm, which owns all navigation reliability:
    // table-scoped row lookup, scroll-to-reveal, testId/href/button/global
    // fallback selectors, trial-click check, force-click retry, direct href
    // goto last resort, and URL pattern + load-state verification.
    const opened = await openForm(page, formMatcher);
    if (!opened) {
      throw new Error(`Could not find or open form: ${formMatcher}`);
    }

    // ── Form ready check ───────────────────────────────────────────────────
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

    // ── Fill fields ────────────────────────────────────────────────────────

    for (const fieldDefinition of Object.entries(fields)) {
      const [fieldIdentifier, fieldConfig] = fieldDefinition;
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
      await fillField(testInfo, page, fieldConfig, dataForField);
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
