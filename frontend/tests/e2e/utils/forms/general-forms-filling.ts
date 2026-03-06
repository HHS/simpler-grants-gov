import { expect, Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  value: string;
  type: "text" | "dropdown";
  section: string;
}

export interface FillFormOptions {
  formName: string;
  fields: FillFieldDefinition[];
  saveButtonTestId?: string;
  noErrorsText?: string;
  formLoadTimeoutMs?: number;
  noErrorsTimeoutMs?: number;
}

export async function fillField(
  testInfo: TestInfo,
  page: Page,
  field: FillFieldDefinition,
): Promise<void> {
  try {
    if (field.type === "dropdown" && field.selector) {
      await selectDropdownByValueOrLabel(page, field.selector, field.value);
    } else if (field.type === "text" && field.testId) {
      const locator = page.getByTestId(field.testId);
      await locator.waitFor({ state: "attached", timeout: 5000 });
      await locator.fill(field.value);
    }

    await testInfo.attach(`fillField-${field.section}-success`, {
      body: `Successfully filled ${field.section}: "${field.value}"`,
      contentType: "text/plain",
    });
  } catch (error) {
    await testInfo.attach(`fillField-${field.section}-error`, {
      body: `Failed to fill ${field.section}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      contentType: "text/plain",
    });

    throw new Error(
      `Failed to fill ${field.section}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export async function fillAnyForm(
  testInfo: TestInfo,
  page: Page,
  options: FillFormOptions,
): Promise<void> {
  const {
    formName,
    fields,
    saveButtonTestId = "apply-form-save",
    noErrorsText = "No errors were detected",
    formLoadTimeoutMs = 35000,
    noErrorsTimeoutMs = 10000,
  } = options;

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
      .waitFor({ state: "visible", timeout: formLoadTimeoutMs });

    for (const field of fields) {
      await fillField(testInfo, page, field);
    }

    await page.waitForTimeout(500);
    await page.getByTestId(saveButtonTestId).click();

    await expect(page.getByText(noErrorsText)).toBeVisible({
      timeout: noErrorsTimeoutMs,
    });

    await page.goto(applicationURL);
  } catch (error) {
    await testInfo.attach("fillForm-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    throw error;
  }
}
