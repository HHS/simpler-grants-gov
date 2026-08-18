// select-field.ts
// Handles select page fields and label-based option selection helpers.
// Usage: import { selectHandler, selectOptionByLabel } from "tests/e2e/utils/common/select-field";

import { type Page } from "@playwright/test";

import { clickAndSelectOption } from "./interaction-utils";
import { type FieldHandler, type FillFieldDefinition } from "./types";

export const selectOptionByLabel = async (
  page: Page,
  label: string,
  optionText: string,
  exact?: boolean,
) => {
  const select = page.getByLabel(label, { exact }).first();
  await clickAndSelectOption(select, optionText);
};

export const selectHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Select field ${field.field} requires string data, received ${typeof data}`,
    );
  }

  const label = field.label ?? field.field;
  await selectOptionByLabel(page, label, data, field.labelExact);
};
