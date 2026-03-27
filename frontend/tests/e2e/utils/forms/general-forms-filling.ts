import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

import { getFormLink } from "./form-navigation-utils";

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  getByText?: string;
  textExact?: boolean;
  hasTextRegex?: string;
  type: "text" | "dropdown" | "checkbox" | "file";
  section?: string;
  field: string;
}

/**
 * Determines whether a checkbox field should be activated during form filling.
 * Returns true for boolean true, or any string that isn't "false".
 */
function shouldActivateField(data: string | boolean | undefined): boolean {
  if (typeof data === "boolean") {
    return data;
  }
  return data !== undefined && data.toLowerCase() !== "false";
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
   * Optional form-specific hook for confirmation checkbox is called
   * before the save button is clicked. Use for pre-save interactions
   * that cannot be expressed as a field definition.
   * e.g. SF-424A confirmation checkbox that only appears in this form
   */
  beforeSave?: (page: Page) => Promise<void>;
}

export interface FormsFixtureData {
  formName: string | RegExp;
  fields: FillFieldDefinition[];
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
      field.type === "dropdown" &&
      field.selector &&
      typeof data === "string"
    ) {
      await selectDropdownByValueOrLabel(page, field.selector, data);
    } else if (
      field.type === "text" &&
      field.testId &&
      typeof data === "string"
    ) {
      const locator = page.getByTestId(field.testId);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.fill(data);
    } else if (
      field.type === "checkbox" &&
      (field.testId || field.selector || field.getByText)
    ) {
      if (shouldActivateField(data)) {
        let locator = field.getByText
          ? page.getByText(field.getByText, { exact: field.textExact ?? false })
          : field.selector
            ? page.locator(field.selector)
            : page.getByTestId(field.testId as string);
        if (field.hasTextRegex) {
          locator = locator.filter({
            hasText: new RegExp(field.hasTextRegex),
          });
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
          `File field ${fieldIdentifier} requires a string file path, received ${typeof data}`,
        );
      }
      const locator = field.selector
        ? page.locator(field.selector)
        : page.getByTestId(field.testId!);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.setInputFiles(data);
      // Wait for the uploaded filename to appear in the UI before proceeding
      const fileName = data.split("/").pop() ?? data;
      await page
        .locator(`span:has-text("${fileName}")`)
        .waitFor({ state: "visible", timeout: 15000 });
    } else {
      console.error("unsupported field type or selector type", field);
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
  data: Record<string, string | boolean>,
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

    // Wait for the URL to change away from the application page before
    // checking for form content — without this, getByText(formName) may
    // immediately resolve against the link text on the application list page,
    // causing fillField to run before navigation completes.
    await page.waitForURL((url) => url.href !== applicationURL, {
      timeout: 35000,
    });

    await page
      .getByText(formName)
      .first()
      .waitFor({ state: "visible", timeout: 35000 });

    for (const fieldDefinition of Object.entries(fields)) {
      const [fieldIdentifier, fieldConfig] = fieldDefinition;
      const dataForField = data[fieldIdentifier];
      await fillField(testInfo, page, fieldConfig, dataForField);
    }

    // Run form-specific confirmation step if defined.
    // Optional - existing forms without this property are unaffected.
    if (config.beforeSave) {
      await config.beforeSave(page);
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
