// radio-button-handler.ts
// Handles radio button fields for E2E form filling.
// Usage: import { radioButtonHandler } from './radio-button-handler';

import { FieldHandler } from "./types";
import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";

export const radioButtonHandler: FieldHandler = async (testInfo, page, field, data) => {
  if (field.getByText !== undefined || shouldActivateField(data)) {
    const locator = getChoiceLocator(page, field, data);
    await locator.waitFor({ state: "visible", timeout: 5000 });
    await locator.click();
  }
};
