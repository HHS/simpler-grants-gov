/**
 * Handles radio-button page fields using choice-locator field properties.
 * Usage: import { radioButtonHandler } from "tests/e2e/utils/common/radio-button-handler";
 */

import { type Locator, type Page } from "@playwright/test";

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { type FieldHandler, type FillFieldDefinition } from "./types";

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
