/**
 * Handles date page fields and date-input fill helpers using accessible labels.
 * Usage: import { dateHandler, fillDateByLabel } from "tests/e2e/utils/common/date-field";
 */

import { expect, type Page } from "@playwright/test";

import { type FillFieldDefinition, type FieldHandler } from "./types";

/** Fills a date input by label and blurs it to trigger validations. */
export const fillDateByLabel = async (
  page: Page,
  label: string,
  dateValue: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await expect(input).toBeVisible();
  await input.fill(dateValue);
  await input.press("Tab");
};

/** Routes date-type fields through the shared date-label helper. */
export const dateHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Date field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const label = field.label ?? field.field;
  await fillDateByLabel(page, label, data, field.labelExact);
};
