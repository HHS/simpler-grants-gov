/**
 * Simple field-type handlers: text, email, dropdown, select, date, radio.
 *
 * Consolidated from six separate single-purpose files (text-handler.ts,
 * email-field.ts, dropdown-handler.ts, select-field.ts, date-field.ts,
 * radio-button-handler.ts). Each had exactly one caller (the field handler
 * map in fill-field.ts) and no dependencies on each other, so splitting
 * them into their own files added file-count without adding isolation.
 *
 * checkbox-handler.ts, file-handler.ts, and combo-box-input-handler.ts stay
 * as their own files - they carry real independent logic (checkbox-handler
 * alone is 225 lines) and are worth keeping separate.
 *
 * Usage: import { textHandler, emailHandler, dropdownHandler, selectHandler,
 * dateHandler, radioButtonHandler } from "tests/e2e/utils/fields/simple-field-handlers";
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/forms/select-dropdown-utils";

import { shouldActivateField } from "tests/e2e/utils/common/activation";
import { getChoiceLocator } from "tests/e2e/utils/common/choice-locator";
import { escapeRegex } from "tests/e2e/utils/common/regex-utils";
import { type FieldHandler, type FillFieldDefinition } from "tests/e2e/utils/common/types";

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

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

  // On mobile, scrollIntoViewIfNeeded can stall indefinitely for fields that are
  // already rendered but below the fold or in a progressive layout. Give it a
  // bounded timeout and then fall back to a direct DOM scroll so the test can
  // continue without hanging the whole suite.
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 10000 });
  } catch {
    await locator.evaluate((element) => {
      element.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "center",
      });
    });
  }

  await locator.waitFor({ state: "visible", timeout: 5000 });
  await locator.fill(data);
};

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

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

  // Use longer timeout (10s) for field attachment to handle lazy-loaded
  // fields on mobile where form rendering may be progressive/async.
  await locator.waitFor({ state: "attached", timeout: 10000 });
  if (!field.skipEmailTypeCheck) {
    await expect(locator.first()).toHaveAttribute("type", "email");
  }
  await locator.fill(data);
  await locator.press("Tab");
};

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

export const dropdownHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Dropdown field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  if (field.selector) {
    await selectDropdownByValueOrLabel(page, field.selector, data);
    return;
  }
  if (field.testId) {
    const locator = page.getByTestId(`${field.testId}${data}`);
    // Use longer timeout (10s) for field attachment to handle lazy-loaded
    // fields on mobile where form rendering may be progressive/async.
    await locator.waitFor({ state: "attached", timeout: 10000 });
    await locator.waitFor({ state: "visible", timeout: 5000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
    return;
  }
  if (field.label) {
    const control = page
      .getByLabel(field.label, { exact: field.labelExact })
      .first();
    // Use longer timeout (10s) for field attachment to handle lazy-loaded
    // fields on mobile where form rendering may be progressive/async.
    await control.waitFor({ state: "attached", timeout: 10000 });
    await control.waitFor({ state: "visible", timeout: 5000 });
    await control.scrollIntoViewIfNeeded();
    const tagName = await control.evaluate((node) =>
      node.tagName.toLowerCase(),
    );
    if (tagName === "select") {
      await control.selectOption({ label: data });
      return;
    }

    await control.click();
    const option = page
      .getByRole("option", {
        name: new RegExp(`^${escapeRegex(data)}$`, "i"),
      })
      .first();

    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return;
    }

    await control.fill(data);
    await control.press("Enter");
    return;
  }
  throw new Error(
    `Dropdown field ${field.field} is missing selector, testId, or label`,
  );
};

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

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

  const label = field.label ?? field.field;
  await selectOptionByLabel(page, label, data, field.labelExact);
};

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/** Fills a date input by label and blurs it to trigger validations. */
export const fillDateByLabel = async (
  page: Page,
  label: string,
  dateValue: string,
  exact?: boolean,
) => {
  const input = page.getByLabel(label, { exact }).first();
  // Use longer timeout (10s) for field attachment to handle lazy-loaded
  // fields on mobile where form rendering may be progressive/async.
  await input.waitFor({ state: "attached", timeout: 10000 });
  await expect(input).toBeVisible({ timeout: 5000 });
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

// ---------------------------------------------------------------------------
// Radio button
// ---------------------------------------------------------------------------

/** Checks a radio input by clicking its associated label when direct check fails. */
async function checkRadioViaLabelFallback(
  page: Page,
  locator: Locator,
  fieldName: string,
): Promise<void> {
  const inputId = await locator.getAttribute("id");
  if (!inputId) {
    throw new Error(
      `Radio field ${fieldName} is offscreen and has no id for label fallback`,
    );
  }

  const label = page.locator(`label[for="${inputId}"]`).first();
  // Use longer timeout (10s) for field attachment to handle lazy-loaded labels.
  await label.waitFor({ state: "attached", timeout: 10000 });
  await label.waitFor({ state: "visible", timeout: 5000 });
  await label.scrollIntoViewIfNeeded();
  await label.click();
}

/** Handles radio fields using shared locator resolution and fallback click paths. */
export const radioButtonHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  const hasExplicitChoiceLocator = Boolean(
    field.getByText || field.selector || field.testId,
  );

  // Radio groups may represent the negative branch with false-like data while
  // still requiring a click on an explicitly configured "No" option.
  if (!hasExplicitChoiceLocator && !shouldActivateField(data)) {
    return;
  }

  const locator = getChoiceLocator(page, field, data);
  // Use longer timeout (10s) for field attachment to handle lazy-loaded
  // fields on mobile where form rendering may be progressive/async.
  await locator.waitFor({ state: "attached", timeout: 10000 });
  await locator.waitFor({ state: "visible", timeout: 5000 });
  await locator.scrollIntoViewIfNeeded();

  if (await locator.isChecked()) {
    return;
  }

  try {
    await locator.check({ timeout: 5000 });
  } catch {
    await checkRadioViaLabelFallback(page, locator, field.field);
  }

  if (!(await locator.isChecked())) {
    throw new Error(`Radio field ${field.field} did not reach checked state`);
  }
};
