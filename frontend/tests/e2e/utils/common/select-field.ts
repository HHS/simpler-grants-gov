// select-field.ts
// Handles select page fields and label-based option selection helpers.
// Usage: import { selectHandler, selectOptionByLabel } from "tests/e2e/utils/common/select-field";

import { type Page } from "@playwright/test";

import { type FieldHandler, type FillFieldDefinition } from "./types";

export const selectOptionByLabel = async (
  page: Page,
  label: string,
  optionText: string,
  exact?: boolean,
) => {
  const select = page.getByLabel(label, { exact }).first();
  // Use longer timeout (10s) for field attachment to handle lazy-loaded
  // fields on mobile where form rendering may be progressive/async.
  await select.waitFor({ state: "attached", timeout: 10000 });
  await select.waitFor({ state: "visible", timeout: 5000 });
  await select.selectOption({ label: optionText });
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

  // Prefer explicit selector when provided because some pages contain
  // similarly labeled controls and selector targeting is more deterministic.
  if (field.selector) {
    const select = page.locator(field.selector).first();
    await select.waitFor({ state: "visible", timeout: 5000 });
    await select.selectOption({ label: data });
    return;
  }

  const label = field.label ?? field.field;
  await selectOptionByLabel(page, label, data, field.labelExact);
};
