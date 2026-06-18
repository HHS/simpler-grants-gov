/**
 * Handles email page fields and label-based email input helpers.
 * Usage: import { emailHandler, fillEmailByLabel } from "tests/e2e/utils/common/email-field";
 */

import { expect, type Page } from "@playwright/test";

import { fillTextByLabel } from "./text-handler";
import { type FillFieldDefinition, type FieldHandler } from "./types";

/** Fills an email input by label and validates the input type first. */
export const fillEmailByLabel = async (
  page: Page,
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
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Email field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const label = field.label ?? field.field;
  await fillEmailByLabel(page, label, data, field.labelExact);
};
