
import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

/**
 * Field definition for generic page filling utilities.
 */
export interface PageFillFieldDefinition {
  testId?: string;
  selector?: string;
  label?: string;
  optionTestIdPrefix?: string;
  hasTextRegex?: string;
  getByText?: string;
  useDataAsText?: boolean;
  textExact?: boolean;
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
  type: "text" | "dropdown" | "file" | "radiobutton" | "checkbox" | "combo-box-input";
  section?: string;
  field: string;
}

/**
 * Map of field keys to PageFillFieldDefinition
 */
export type PageFillFieldDefinitions = Record<string, PageFillFieldDefinition>;

/**
 * Determines if a field should be activated (filled/checked) based on the data value.
 */
function shouldActivateField(data: string | boolean | undefined): boolean {
  if (typeof data === "boolean") return data;
  return data !== undefined && data.toLowerCase() !== "false";
}


/**
 * Fills a single field on a page using the provided definition and data.
 * Handles text, dropdown, combo-box, radio, checkbox, and file fields.
 * Attaches success/failure logs to testInfo for traceability.
 */
export async function fillPageField(
  testInfo: TestInfo,
  page: Page,
  field: PageFillFieldDefinition,
  data: string | boolean | undefined,
): Promise<void> {
  const fieldIdentifier = field.section ? `${field.section}-${field.field}` : field.field;
  try {
    if (data === undefined) {
      await testInfo.attach(`fillPageField-${fieldIdentifier}-skipped`, {
        body: `Skipped ${fieldIdentifier}: no data provided`,
        contentType: "text/plain",
      });
      return;
    }

    // Type/data validation
    if ((["dropdown", "combo-box-input", "text", "file"].includes(field.type)) && typeof data !== "string") {
      throw new Error(`Field ${fieldIdentifier} requires string data, received ${typeof data}`);
    }

    // Dropdowns
    if (field.type === "dropdown") {
      if (field.selector) {
        await selectDropdownByValueOrLabel(page, field.selector, data as string);
        return;
      }
      if (field.label) {
        const locator = page.getByLabel(field.label);
        await locator.waitFor({ state: "visible", timeout: 5000 });
        try {
          await locator.selectOption({ value: data as string });
        } catch {
          await locator.selectOption({ label: data as string });
        }
        return;
      }
      if (field.testId) {
        const locator = page.getByTestId(`${field.testId}${data}`);
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
        return;
      }
      throw new Error(`Dropdown field ${fieldIdentifier} is missing selector, label, or testId`);
    }

    // Combo-box
    if (field.type === "combo-box-input" && field.testId) {
      const toggleLocator = page.getByTestId(field.testId);
      await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
      await toggleLocator.click();
      const optionPrefix = field.optionTestIdPrefix ?? "combo-box-option-";
      const optionLocator = page.getByTestId(`${optionPrefix}${data}`);
      await optionLocator.waitFor({ state: "visible", timeout: 5000 });
      await optionLocator.click();
      return;
    }

    // Text fields
    if (field.type === "text" && (field.testId || field.selector || field.label) && typeof data === "string") {
      const locator = field.label
        ? page.getByLabel(field.label)
        : field.selector
          ? page.locator(field.selector)
          : page.getByTestId(field.testId as string);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.fill(data);
      return;
    }

    // Radio buttons
    if (field.type === "radiobutton" && (field.testId || field.selector || field.getByText || field.useDataAsText)) {
      if (field.getByText !== undefined || shouldActivateField(data)) {
        let locator = field.getByText
          ? page.getByText(field.getByText, { exact: field.textExact ?? false })
          : field.selector
            ? page.locator(field.selector)
            : field.testId
              ? page.getByTestId(field.testId)
              : page.getByText(String(data), { exact: field.textExact ?? field.useDataAsText ?? false });
        if (field.hasTextRegex) {
          locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
        }
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
      }
      return;
    }

    // Checkboxes
    if (field.type === "checkbox" && (field.testId || field.selector || field.getByText)) {
      if (shouldActivateField(data)) {
        let locator = field.getByText
          ? page.getByText(field.getByText, { exact: field.textExact ?? false })
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
          const nestedCheckbox = locator.locator('input[type="checkbox"]').first();
          if ((await nestedCheckbox.count()) === 0) {
            throw new Error(`Checkbox field ${fieldIdentifier} is not checkable; map to the checkbox input testId`);
          }
          if (!(await nestedCheckbox.isChecked())) {
            await nestedCheckbox.check();
          }
        }
      }
      return;
    }

    // File upload
    if (field.type === "file" && (field.testId || field.selector)) {
      if (typeof data !== "string") {
        throw new Error(`File field ${fieldIdentifier} requires string data (file path), received ${typeof data}`);
      }
      const locator = field.selector ? page.locator(field.selector) : page.getByTestId(field.testId!);
      await locator.waitFor({ state: "attached", timeout: 30000 });
      await locator.scrollIntoViewIfNeeded();
      await locator.setInputFiles(data);
      return;
    }

    throw new Error(`Unsupported or invalid field configuration for ${fieldIdentifier}`);
  } catch (error) {
    await testInfo.attach(`fillPageField-${fieldIdentifier}-error`, {
      body: `Failed to fill ${fieldIdentifier}: ${error instanceof Error ? error.message : String(error)}`,
      contentType: "text/plain",
    });
    throw new Error(`Failed to fill ${field.field}: ${error instanceof Error ? error.message : String(error)}`);
  }
  await testInfo.attach(`fillPageField-${fieldIdentifier}-success`, {
    body: `Successfully filled ${fieldIdentifier}: "${data}"`,
    contentType: "text/plain",
  });
}


/**
 * Fills a subset of fields on the current page without navigation.
 * Uses shared field-filling behavior so page tests remain consistent.
 */
export async function fillPagePartial(
  testInfo: TestInfo,
  page: Page,
  fieldDefinitions: PageFillFieldDefinitions,
  data: Record<string, string | boolean>,
): Promise<void> {
  for (const key of Object.keys(data)) {
    const fieldDef = fieldDefinitions[key];
    if (fieldDef) {
      await fillPageField(testInfo, page, fieldDef, data[key]);
    }
  }
}
