/**
 * Handles email page fields.
 * Usage: import { emailHandler } from "tests/e2e/utils/common/email-field";
 */

import { expect, type Page } from "@playwright/test";

import { clickAndFill } from "./interaction-utils";
import { type FieldHandler, type FillFieldDefinition } from "./types";

/** Routes email-type fields through selector/testId/label targeting. */
export const emailHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Email field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const locator = field.selector
    ? page.locator(field.selector)
    : field.testId
      ? page.getByTestId(field.testId)
      : field.label
        ? page.getByLabel(field.label, { exact: field.labelExact })
        : null;

  if (!locator) {
    throw new Error(
      `Email field ${field.field} requires selector, testId, or label`,
    );
  }

  await locator.waitFor({ state: "visible", timeout: 5000 });
  if (!field.skipEmailTypeCheck) {
    await expect(locator.first()).toHaveAttribute("type", "email");
  }
  await clickAndFill(locator, data);
  await locator.press("Tab");
};
