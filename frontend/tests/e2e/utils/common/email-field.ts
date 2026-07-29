/**
 * Handles email page fields and label-based email input helpers.
 * Usage: import { emailHandler, fillEmailByLabel } from "tests/e2e/utils/common/email-field";
 */

import { expect, type Page } from "@playwright/test";

import { type FieldHandler, type FillFieldDefinition } from "./types";

/** Fills an email-like input by label and blurs it to trigger validation. */
export const fillEmailByLabel = async (
  page: Page,
  label: string,
  value: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await expect(input).toBeVisible();
  await input.fill(value);
  await input.press("Tab");
};

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

  await locator.waitFor({ state: "attached", timeout: 5000 });
  await locator.fill(data);
  await locator.press("Tab");
};
