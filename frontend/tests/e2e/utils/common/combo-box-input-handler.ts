// combo-box-input-handler.ts
// Handles combo-box page fields using test ID and option-prefix properties.
// Usage: import { comboBoxInputHandler } from "tests/e2e/utils/common/combo-box-input-handler";

import { FieldHandler } from "./types";

export const comboBoxInputHandler: FieldHandler = async (
  _testInfo,
  page,
  field,
  data,
) => {
  if (!field.testId) {
    throw new Error(`Combo box field ${field.field} requires a testId`);
  }
  if (typeof data !== "string") {
    throw new Error(
      `Combo box field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  const toggleLocator = page.getByTestId(field.testId);
  await toggleLocator.waitFor({ state: "visible", timeout: 5000 });
  await toggleLocator.click();
  const optionPrefix = field.optionTestIdPrefix ?? "combo-box-option-";
  const optionLocator = page.getByTestId(`${optionPrefix}${data}`);
  await optionLocator.waitFor({ state: "visible", timeout: 5000 });
  await optionLocator.click();
};
