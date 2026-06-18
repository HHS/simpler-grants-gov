/**
 * Handles checkbox page fields using checkbox field properties.
 * Usage: import { checkboxHandler } from "tests/e2e/utils/common/checkbox-handler";
 */

import { type Page } from "@playwright/test";

import { shouldActivateField } from "./activation";
import { getChoiceLocator } from "./choice-locator";
import { type FillFieldDefinition, type FieldHandler } from "./types";

/** Falls back to nested checkbox input interactions when primary locator actions fail. */
const applyNestedCheckboxFallback = async (
  page: Page,
  singleLocator: Awaited<ReturnType<typeof getChoiceLocator>>,
  fieldName: string,
  shouldBeChecked: boolean,
  originalError: unknown,
) => {
  const nestedCheckbox = singleLocator
    .locator('input[type="checkbox"]')
    .first();
  if ((await nestedCheckbox.count()) === 0) {
    throw originalError instanceof Error
      ? originalError
      : new Error(
          `Checkbox field ${fieldName} is not checkable; map to the checkbox input testId`,
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
      `Checkbox field ${fieldName} did not reach expected state ${shouldBeChecked}`,
    );
  }
};

/** Handles checkbox fields with support for grouped options and label-click fallbacks. */
export const checkboxHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (page.isClosed()) {
    throw new Error(
      `Page closed before checkbox field ${field.field} could be filled`,
    );
  }

  const shouldBeChecked = shouldActivateField(data);
  const usesRoleBasedCheckboxLocator =
    !field.getByText &&
    !field.selector &&
    !field.testId &&
    typeof data === "string";
  const locator = getChoiceLocator(page, field, data);
  const locatorCount = await locator.count();
  if (locatorCount === 0) {
    throw new Error(`Checkbox field ${field.field} was not found`);
  }

  if (locatorCount === 1) {
    await locator.waitFor({ state: "visible", timeout: 5000 });
  } else {
    if (!field.selectFirstInGroup) {
      throw new Error(
        `Checkbox field ${field.field} matched ${locatorCount} elements. Set selectFirstInGroup=true for intentional checkbox groups.`,
      );
    }
    await locator.first().waitFor({ state: "visible", timeout: 5000 });
  }

  /** Sets a locator to the target checked state and verifies the result. */
  const setLocatorCheckedState = async (target: typeof locator) => {
    const currentState = await target.isChecked();
    if (shouldBeChecked === currentState) {
      return;
    }

    try {
      if (shouldBeChecked) {
        await target.check({ timeout: 2000 });
      } else {
        await target.uncheck({ timeout: 2000 });
      }
    } catch {
      const inputId = await target.getAttribute("id");
      if (!inputId) {
        throw new Error(
          `Checkbox field ${field.field} is offscreen and has no id for label fallback`,
        );
      }
      const label = page.locator(`label[for="${inputId}"]`).first();
      await label.waitFor({ state: "visible", timeout: 5000 });
      await label.click();
    }

    const finalState = await target.isChecked();
    if (finalState !== shouldBeChecked) {
      throw new Error(
        `Checkbox field ${field.field} did not reach expected state ${shouldBeChecked}`,
      );
    }
  };

  if (locatorCount > 1) {
    if (!field.selectFirstInGroup) {
      throw new Error(
        `Checkbox field ${field.field} matched ${locatorCount} elements. Set selectFirstInGroup=true for intentional checkbox groups.`,
      );
    }

    if (shouldBeChecked) {
      for (let i = 0; i < locatorCount; i++) {
        const candidate = locator.nth(i);
        if (!(await candidate.isChecked())) {
          await setLocatorCheckedState(candidate);
          return;
        }
      }
      return;
    }

    for (let i = 0; i < locatorCount; i++) {
      const candidate = locator.nth(i);
      if (await candidate.isChecked()) {
        await setLocatorCheckedState(candidate);
      }
    }
    return;
  }

  const singleLocator = locator.first();
  /** Clicks the associated label when direct checkbox interactions are not actionable. */
  const toggleViaLabel = async () => {
    const inputId = await singleLocator.getAttribute("id");
    if (!inputId) {
      throw new Error(
        `Checkbox field ${field.field} is offscreen and has no id for label fallback`,
      );
    }

    const label = page.locator(`label[for="${inputId}"]`).first();
    await label.waitFor({ state: "visible", timeout: 5000 });
    await label.click();
  };

  /** Applies the desired checked state for a single resolved checkbox locator. */
  const setCheckedState = async () => {
    const isChecked = await singleLocator.isChecked();
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
        await singleLocator.check({ timeout: 2000 });
      } else {
        await singleLocator.uncheck({ timeout: 2000 });
      }
    } catch {
      await toggleViaLabel();
    }

    const finalChecked = await singleLocator.isChecked();
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
    await applyNestedCheckboxFallback(
      page,
      singleLocator,
      field.field,
      shouldBeChecked,
      error,
    );
  }
};
