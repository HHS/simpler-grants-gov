import path from "path";
import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

import { getFormLink } from "./form-navigation-utils";

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  optionTestIdPrefix?: string;
  hasTextRegex?: string;
  getByText?: string;
  textExact?: boolean;
  buttonName?: string;
  type:
    | "text"
    | "dropdown"
    | "file"
    | "radiobutton"
    | "checkbox"
    "radio-button" | "combo-box-input";
    OR
    "radioButton" | "comboBoxInput";
    OR
    "radio_button" | "combo_box_input";
  section?: string;
  field: string;
}

export type FormFillFieldDefinitions = {
  [fieldIdentifier: string]: FillFieldDefinition;
};

export interface FillFormConfig {
  formName: string;
  fields: FormFillFieldDefinitions;
  saveButtonTestId: string;
  noErrorsText?: string;
}

export interface FormsFixtureData {
  formName: string;
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

    if (field.type === "dropdown" && typeof data === "string") {
      if (field.selector) {
        await selectDropdownByValueOrLabel(page, field.selector, data);
      } else if (field.testId) {
        const resolvedTestId = field.testId.includes("{value}")
          ? field.testId.replace("{value}", data)
          : `${field.testId}${data}`;
        const locator = page.getByTestId(resolvedTestId);
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
      } else {
        throw new Error(
          `Dropdown field ${fieldIdentifier} is missing selector/testId`,
        );
      }
    } else if (
      field.type === "combo-box-input" &&
      field.testId &&
      typeof data === "string"
    ) {
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
      field.type === "file" &&
      field.buttonName &&
      typeof data === "string"
    ) {
      const locator = page.getByRole("button", { name: field.buttonName });
      await locator.waitFor({ state: "visible", timeout: 5000 });


      // Always expect either an absolute path or just a file name (relative to a specific directory)
      // If not absolute, resolve using a hardcoded directory for test files
      const TEST_FILES_DIR = path.resolve(__dirname, "../../../../tests/e2e/test-files");
      const absolutePath = path.isAbsolute(data)
        ? data
        : path.join(TEST_FILES_DIR, data);
      await locator.setInputFiles(absolutePath);

      await page.waitForLoadState("load", { timeout: 15000 });
    } else if (
      field.type === "radiobutton" &&
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
 * Fills a form from the application page and saves it.
 * Does NOT perform assertions - those should be done in the test.
 * Assumes the current page is already an application page
 * where the form link (`formName`) is visible and clickable.
 */
export async function fillForm(
  testInfo: TestInfo,
  page: Page,
  config: FillFormConfig,
  data: Record<string, string>,
  returnToApplication = true,
): Promise<void> {
  const { formName, fields, saveButtonTestId } = config;

  const applicationURL = page.url();

  await testInfo.attach("fillForm-applicationURL", {
    body: `Application URL: ${applicationURL}`,
    contentType: "text/plain",
  });

  try {
    await page.getByRole("link", { name: formName }).click();

    await page
      .getByText(formName)
      .first()
      .waitFor({ state: "visible", timeout: 35000 });

    for (const fieldDefinition of Object.entries(fields)) {
      const [fieldIdentifier, fieldConfig] = fieldDefinition;
      const dataForField = data[fieldIdentifier];
      await fillField(testInfo, page, fieldConfig, dataForField);
    }

    await page.waitForTimeout(500);
    await page.getByTestId(saveButtonTestId).click();

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

/**
 * Verifies that a form link or button is visible on the page.
 * Use after application creation to confirm the forms table has fully rendered
 * before attempting to navigate into a form.
 * @param page Playwright Page object
 * @param formName Form name or pipe-separated pattern to match (e.g. "SF-424B|Assurances for Non-Construction Programs")
 */
export async function verifyFormLinkVisible(
  page: Page,
  formName: string,
): Promise<void> {
  await getFormLink(page, formName).waitFor({
    state: "visible",
    timeout: 60000,
  });
}
