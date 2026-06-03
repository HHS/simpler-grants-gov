// checkbox-handler.ts
// Handles checkbox page fields using checkbox field properties.
// Usage: import { checkboxHandler } from "tests/e2e/utils/common/checkbox-handler";

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { FieldHandler } from "./types";

export const checkboxHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  const shouldBeChecked = shouldActivateField(data);
  const locator = getChoiceLocator(page, field, data);
  await locator.waitFor({ state: "visible", timeout: 5000 });
  try {
    const isChecked = await locator.isChecked();
    if (shouldBeChecked && !isChecked) {
      await locator.check();
    }
    if (!shouldBeChecked && isChecked) {
      await locator.uncheck();
    }
  } catch {
    const nestedCheckbox = locator.locator('input[type="checkbox"]').first();
    if ((await nestedCheckbox.count()) === 0) {
      throw new Error(
        `Checkbox field ${field.field} is not checkable; map to the checkbox input testId`,
      );
    }
    const isChecked = await nestedCheckbox.isChecked();
    if (shouldBeChecked && !isChecked) {
      await nestedCheckbox.check();
    }
    if (!shouldBeChecked && isChecked) {
      await nestedCheckbox.uncheck();
    }
  }
};
