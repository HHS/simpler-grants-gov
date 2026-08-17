// combo-box-input-handler.ts
// Handles combo-box page fields using test ID and option-prefix properties.
// Usage: import { comboBoxInputHandler } from "tests/e2e/utils/common/combo-box-input-handler";

import { type Page } from "@playwright/test";

import { type FieldHandler, type FillFieldDefinition } from "./types";

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const comboBoxInputHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (!field.testId) {
    throw new Error(`Combo box field ${field.field} requires a testId`);
  }
  if (typeof data !== "string") {
    throw new Error(
      `Combo box field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  try {
    const toggleLocator = page.getByTestId(field.testId);
    await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
    await toggleLocator.click();
    const optionPrefix = field.optionTestIdPrefix ?? "combo-box-option-";
    const optionLocator = page.getByTestId(`${optionPrefix}${data}`);
    await optionLocator.waitFor({ state: "visible", timeout: 5000 });
    await optionLocator.click();
    return;
  } catch {
    // Fallback for widgets that do not expose stable test IDs for the toggle/options
    // (e.g., MultiSelect based on USWDS ComboBox).
    const comboByLabel = page
      .getByRole("combobox", { name: new RegExp(escapeRegex(field.field), "i") })
      .first();
    await comboByLabel.waitFor({ state: "visible", timeout: 5000 });
    await comboByLabel.click();
    await comboByLabel.fill(data);
    await comboByLabel.press("Enter");
  }
};
