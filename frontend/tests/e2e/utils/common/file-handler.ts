// file-handler.ts
// Handles file-upload page fields using selector and test ID properties.
// Usage: import { fileHandler } from "tests/e2e/utils/common/file-handler";

import { type Page } from "@playwright/test";

import { type FieldHandler, type FillFieldDefinition } from "./types";

export const fileHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
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
    : field.testId
      ? page.getByTestId(field.testId)
      : (() => {
          throw new Error(
            `File field ${field.field} requires a selector or testId`,
          );
        })();
  await locator.waitFor({ state: "attached", timeout: 30000 });
  await locator.scrollIntoViewIfNeeded();
  const inputName = await locator.getAttribute("name");
  const inputId = await locator.getAttribute("id");

  // Certain virus-scanning upload implementations such as apply forms, name the visible file
  // input `${fieldId}-visible` while the actual form value lives in a hidden input
  // named `${fieldId}` so strip the suffix so both widget variants resolve.
  const toHiddenInputName = (value: string) => value.replace(/-visible$/, "");
  const hiddenInputName = inputName ? toHiddenInputName(inputName) : null;
  const hiddenInputId = inputId ? toHiddenInputName(inputId) : null;
  const hiddenInputSelector = hiddenInputName
    ? `input[type="hidden"][name="${hiddenInputName}"]`
    : hiddenInputId
      ? `input[type="hidden"][name="${hiddenInputId}"], input[type="hidden"]#${hiddenInputId}`
      : null;
  await locator.setInputFiles(data);
  const fileName = data.split(/[/\\]/).pop() ?? data;
  if (hiddenInputSelector) {
    await page
      .locator(hiddenInputSelector)
      .locator(
        "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' usa-form-group ') or contains(concat(' ', normalize-space(@class), ' '), ' simpler-formgroup ')][1]",
      )
      // SimplerFileInput (virus scanning) component renders it in a div FileInputExistingFiles
      // and non-virus scanning file uploads render it in a span.
      // Filter to visible elements - the USWDS file input keeps a hidden
      // preview node containing the file name after upload.
      .locator("span, div")
      .filter({ hasText: fileName })
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
  } else {
    await page
      .locator(`span:has-text("${fileName}")`)
      .waitFor({ state: "visible", timeout: 30000 });
  }
  if (hiddenInputSelector) {
    await page.waitForFunction(
      ({
        selector,
        uploadedFileName,
      }: {
        selector: string;
        uploadedFileName: string;
      }) => {
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
        return Array.from(fieldContainer.querySelectorAll("span, div")).some(
          (element) =>
            element.textContent?.trim() === uploadedFileName &&
            element.checkVisibility(),
        );
      },
      { selector: hiddenInputSelector, uploadedFileName: fileName },
      { timeout: 60000 },
    );
  }
};
