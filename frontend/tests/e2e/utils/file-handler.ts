// file-handler.ts
// Handles file upload fields for E2E form filling.
// Usage: import { fileHandler } from './file-handler';

import { FieldHandler } from "./types";

export const fileHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (!field.testId && !field.selector) {
    throw new Error(`File field ${field.field} requires a selector or testId`);
  }
  if (typeof data !== "string") {
    throw new Error(
      `File field ${field.field} requires string data (file path), received ${typeof data}`,
    );
  }
  const locator = field.selector
    ? page.locator(field.selector)
    : page.getByTestId(field.testId!);
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
        const hiddenInput = document.querySelector<HTMLInputElement>(selector);
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
};
