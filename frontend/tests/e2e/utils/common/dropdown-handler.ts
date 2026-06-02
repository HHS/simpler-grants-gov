// dropdown-handler.ts
// Handles dropdown page fields using selector and test ID properties.
// Usage: import { dropdownHandler } from "tests/e2e/utils/common/dropdown-handler";

import { selectDropdownByValueOrLabel } from "tests/e2e/utils/select-dropdown-utils";

import { FieldHandler } from "./types";

export const dropdownHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Dropdown field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  if (field.selector) {
    await selectDropdownByValueOrLabel(page, field.selector, data);
    return;
  }
  if (field.testId) {
    const locator = page.getByTestId(`${field.testId}${data}`);
    await locator.waitFor({ state: "visible", timeout: 5000 });
    await locator.click();
    return;
  }
  throw new Error(
    `Dropdown field ${field.field} is missing selector or testId`,
  );
};
