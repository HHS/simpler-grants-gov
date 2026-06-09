// email-field.ts
// Handles email page fields and label-based email input helpers.
// Usage: import { emailHandler, fillEmailByLabel } from "tests/e2e/utils/common/email-field";

import { type Page } from "@playwright/test";
import { FieldHandler } from "./types";

export const fillEmailByLabel = async (
  page: Page,
  label: string,
  value: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.fill(value);
};

export const emailHandler: FieldHandler = async (
  testInfo,
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