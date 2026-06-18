/**
 * Handles email page fields and label-based email input helpers.
 * Usage: import { emailHandler, fillEmailByLabel } from "tests/e2e/utils/common/email-field";
 */

import { expect } from "@playwright/test";

import { fillTextByLabel } from "./text-handler";
import { FieldHandler } from "./types";

/** Fills an email input by label and validates the input type first. */
export const fillEmailByLabel = async (
  page: Parameters<FieldHandler>[1],
  label: string,
  value: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute("type", "email");
  await fillTextByLabel(page, label, value, exact);
  await input.press("Tab");
};

/** Routes email-type fields through the shared email-label helper. */
export const emailHandler: FieldHandler = async (
  _testInfo,
  page,
  field,
  data,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Email field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const label = field.label ?? field.field;
  await fillEmailByLabel(page, label, data, field.labelExact);
};
