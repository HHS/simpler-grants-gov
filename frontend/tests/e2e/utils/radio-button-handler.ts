// radio-button-handler.ts
// Handles radio button fields for E2E form filling.
// Usage: import { radioButtonHandler } from './radio-button-handler';

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { FieldHandler } from "./types";

export const radioButtonHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  // Match checkbox behavior: only act when the field should be activated.
  if (shouldActivateField(data)) {
    const locator = getChoiceLocator(page, field, data);
    await locator.waitFor({ state: "visible", timeout: 5000 });
    await locator.click();
  }
};
