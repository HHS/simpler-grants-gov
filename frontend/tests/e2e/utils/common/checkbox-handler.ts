// checkbox-handler.ts
// Handles checkbox page fields using checkbox field properties.
// Usage: import { checkboxHandler } from "tests/e2e/utils/common/checkbox-handler";

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { FieldHandler } from "./types";

export const checkboxHandler: FieldHandler = async (
  testInfo,
  page,
  field,
  data,
) => {
  if (page.isClosed()) {
    throw new Error(
      `Page closed before checkbox field ${field.field} could be filled`,
    );
  }

  const shouldBeChecked = shouldActivateField(data);
  const usesRoleBasedCheckboxLocator =
    !field.getByText && !field.selector && !field.testId && typeof data === "string";
  const locator = getChoiceLocator(page, field, data);
  await locator.waitFor({ state: "visible", timeout: 5000 });
  const toggleViaLabel = async () => {
    const inputId = await locator.getAttribute("id");
    if (!inputId) {
      throw new Error(
        `Checkbox field ${field.field} is offscreen and has no id for label fallback`,
      );
    }

    const label = page.locator(`label[for="${inputId}"]`).first();
    await label.waitFor({ state: "visible", timeout: 5000 });
    await label.click();
  };

  const setCheckedState = async () => {
    const isChecked = await locator.isChecked();
    if (shouldBeChecked === isChecked) {
      return;
    }

    // Role-based checkbox locators can resolve to inputs that are visible to
    // accessibility APIs but intermittently fail actionability checks.
    if (usesRoleBasedCheckboxLocator) {
      try {
        await toggleViaLabel();
        const labelToggledChecked = await locator.isChecked();
        if (labelToggledChecked === shouldBeChecked) {
          return;
        }
      } catch {
        // Fall through to direct check/uncheck path.
      }
    }

    try {
      if (shouldBeChecked) {
        await locator.check({ timeout: 2000 });
      } else {
        await locator.uncheck({ timeout: 2000 });
      }
    } catch {
      await toggleViaLabel();
    }

    const finalChecked = await locator.isChecked();
    if (finalChecked !== shouldBeChecked) {
      throw new Error(
        `Checkbox field ${field.field} did not reach expected state ${shouldBeChecked}`,
      );
    }
  };

  try {
    await setCheckedState();
  } catch (error) {
    if (page.isClosed()) {
      throw error instanceof Error ? error : new Error(String(error));
    }

    const nestedCheckbox = locator.locator('input[type="checkbox"]').first();
    if ((await nestedCheckbox.count()) === 0) {
      throw error instanceof Error
        ? error
        : new Error(
            `Checkbox field ${field.field} is not checkable; map to the checkbox input testId`,
          );
    }

    const nestedChecked = await nestedCheckbox.isChecked();
    if (nestedChecked !== shouldBeChecked) {
      const nestedId = await nestedCheckbox.getAttribute("id");
      if (nestedId) {
        const label = page.locator(`label[for="${nestedId}"]`).first();
        await label.waitFor({ state: "visible", timeout: 5000 });
        await label.click();
      } else if (shouldBeChecked) {
        await nestedCheckbox.check({ timeout: 5000 });
      } else {
        await nestedCheckbox.uncheck({ timeout: 5000 });
      }
    }

    const finalNestedChecked = await nestedCheckbox.isChecked();
    if (finalNestedChecked !== shouldBeChecked) {
      throw new Error(
        `Checkbox field ${field.field} did not reach expected state ${shouldBeChecked}`,
      );
    }
  }
};
