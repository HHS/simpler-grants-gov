// text-handler.ts
// Handles text page fields using text-input field properties.
// Usage: import { textHandler } from "tests/e2e/utils/common/text-handler";

import { FieldHandler } from "./types";

export const fillTextByLabel = async (
  page: Parameters<FieldHandler>[1],
  label: string,
  value: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.fill(value);
};

export const fillTextareaByLabel = async (
  page: Parameters<FieldHandler>[1],
  label: string,
  value: string,
  exact?: boolean,
) => {
  await fillTextByLabel(page, label, value, exact);
};

export const textHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Text field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  const locator = field.testId
    ? page.getByTestId(field.testId)
    : field.label
      ? page.getByLabel(field.label, { exact: field.labelExact })
      : null;

  if (!locator) {
    throw new Error(
      `Text field ${field.field} requires either testId or label`,
    );
  }

  await locator.waitFor({ state: "attached", timeout: 5000 });
  await locator.fill(data);
};

export const textareaHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  await textHandler(testInfo, page, field, data);
};
