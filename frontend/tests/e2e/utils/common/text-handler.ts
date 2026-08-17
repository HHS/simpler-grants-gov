/**
 * Handles text page fields using text-input field properties.
 * Usage: import { textHandler } from "tests/e2e/utils/common/text-handler";
 */

import { type Page } from "@playwright/test";

import { type FieldHandler, type FillFieldDefinition } from "./types";

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
  // Prefer explicit selectors for stable targeting when labels are ambiguous
  // (e.g., "Title" and "Competition title" on the same page).
  const locator = field.selector
    ? page.locator(field.selector)
    : field.testId
      ? page.getByTestId(field.testId)
      : field.label
        ? page.getByLabel(field.label, { exact: field.labelExact })
        : null;

  if (!locator) {
    throw new Error(
      `Text field ${field.field} requires selector, testId, or label`,
    );
  }

  // Use longer timeout (10s) for field attachment to handle lazy-loaded
  // fields on mobile where form rendering may be progressive/async.
  await locator.waitFor({ state: "attached", timeout: 10000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.waitFor({ state: "visible", timeout: 5000 });
  await locator.fill(data);
};
