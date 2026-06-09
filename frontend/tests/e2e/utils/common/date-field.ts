// date-field.ts
// Handles date page fields and date-input fill helpers using accessible labels.
// Usage: import { dateHandler, fillDateByLabel } from "tests/e2e/utils/common/date-field";

import { expect, type Page } from "@playwright/test";

import { FieldHandler } from "./types";

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

export const dateHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Date field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const label = field.label ?? field.field;
  await fillDateByLabel(page, label, data, field.labelExact);
};
