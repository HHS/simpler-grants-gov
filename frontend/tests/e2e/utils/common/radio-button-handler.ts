// radio-button-handler.ts
// Handles radio-button page fields using choice-locator field properties.
// Usage: import { radioButtonHandler } from "tests/e2e/utils/common/radio-button-handler";

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { FieldHandler } from "./types";

export const radioButtonHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
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
  await locator.waitFor({ state: "visible", timeout: 5000 });

  if (await locator.isChecked()) {
    return;
  }

  const checkViaLabel = async () => {
    const inputId = await locator.getAttribute("id");
    if (!inputId) {
      throw new Error(
        `Radio field ${field.field} is offscreen and has no id for label fallback`,
      );
    }

    const label = page.locator(`label[for="${inputId}"]`).first();
    await label.waitFor({ state: "visible", timeout: 5000 });
    await label.click();
  };

  try {
    await locator.check({ timeout: 5000 });
  } catch {
    await checkViaLabel();
  }

  if (!(await locator.isChecked())) {
    throw new Error(`Radio field ${field.field} did not reach checked state`);
  }
};
