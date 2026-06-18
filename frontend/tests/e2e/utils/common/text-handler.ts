/**
 * Handles text page fields using text-input field properties.
 * Usage: import { textHandler } from "tests/e2e/utils/common/text-handler";
 */

import { type Page } from "@playwright/test";

import { type FillFieldDefinition, type FieldHandler } from "./types";

/** Fills a text input resolved by its accessible label. */
export const fillTextByLabel = async (
  page: Page,
  label: string,
  value: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.fill(value);
};

/** Handles text-type fields using testId or label-based locators. */
export const textHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
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
