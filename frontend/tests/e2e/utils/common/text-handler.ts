// text-handler.ts
// Handles text page fields using text-input field properties.
// Usage: import { textHandler } from "tests/e2e/utils/common/text-handler";

import { FieldHandler } from "./types";

export const textHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (!field.testId) {
    throw new Error(`Text field ${field.field} requires a testId`);
  }
  if (typeof data !== "string") {
    throw new Error(
      `Text field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  const locator = page.getByTestId(field.testId);
  await locator.waitFor({ state: "attached", timeout: 5000 });
  await locator.fill(data);
};
