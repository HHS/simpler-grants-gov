import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

export interface FillFieldDefinition {
  testId?: string;
  selector?: string;
  value: string;
  type: "text" | "dropdown";
  section: string;
  field?: string;
}

export interface FillFormConfig {
  formName: string;
  fields: FillFieldDefinition[];
  saveButtonTestId: string;
  returnToApplication?: boolean;
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
): Promise<void> {
  const {
    formName,
    fields,
    saveButtonTestId,
    returnToApplication = true,
  } = config;

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

    for (const field of fields) {
      await fillField(testInfo, page, field);
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
