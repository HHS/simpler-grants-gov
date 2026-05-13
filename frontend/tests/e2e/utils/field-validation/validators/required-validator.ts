import { Page } from "@playwright/test";
import { FieldConfig, FieldValidationResult } from "../types/field-config";
import {
  assertInlineErrorVisible,
  assertNoInlineError,
} from "../utils/assertion-helpers";
import { clearAndBlur, waitAndScrollToField } from "../utils/interaction-helpers";

/**
 * Validates required-field behaviour for a single FieldConfig.
 *
 * - Clears the field and blurs it.
 * - If an errorLocator is configured, asserts the inline error appears.
 * - If only the DOM `required` attribute is present (no errorLocator),
 *   falls back to checking `input.validity.valueMissing`.
 *
 * Returns one FieldValidationResult.
 */
export async function validateRequiredField(
  page: Page,
  config: FieldConfig,
): Promise<FieldValidationResult[]> {
  if (!config.required) {
    return [];
  }

  const locator = page.locator(config.locator).first();
  await waitAndScrollToField(locator);
  await clearAndBlur(locator);

  let passed = false;
  let actualBehavior = "";

  if (config.errorLocator) {
    const isVisible = await page
      .locator(config.errorLocator)
      .first()
      .isVisible()
      .catch(() => false);

    await assertInlineErrorVisible(page, config.errorLocator, "");
    passed = isVisible;
    actualBehavior = isVisible
      ? "Required error visible"
      : "Required error NOT visible";
  } else {
    // Fall back to native constraint validation API
    const valueMissing = await locator
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing)
      .catch(() => false);
    passed = valueMissing;
    actualBehavior = valueMissing
      ? "Field reports valueMissing (required)"
      : "Field does NOT report valueMissing";
  }

  return [
    {
      fieldLabel: config.label,
      validationType: "required",
      inputValue: "(empty)",
      expectedBehavior: "Error or invalid state when field is empty",
      actualBehavior,
      passed,
    },
  ];
}

/**
 * Validates that a required field accepts and retains a valid non-empty value
 * (i.e. no false-positive error when the field is correctly filled).
 */
export async function validateRequiredFieldAcceptsValue(
  page: Page,
  config: FieldConfig,
  validValue: string,
): Promise<FieldValidationResult[]> {
  if (!config.required) {
    return [];
  }

  const locator = page.locator(config.locator).first();
  await waitAndScrollToField(locator);
  await locator.fill(validValue);
  await locator.blur();

  let passed = false;
  let actualBehavior = "";

  if (config.errorLocator) {
    const isVisible = await page
      .locator(config.errorLocator)
      .first()
      .isVisible()
      .catch(() => false);

    await assertNoInlineError(page, config.errorLocator);
    passed = !isVisible;
    actualBehavior = isVisible
      ? "Error still visible after filling (unexpected)"
      : "No error (field accepted value)";
  } else {
    const isValid = await locator
      .evaluate((el) => (el as HTMLInputElement).validity.valid)
      .catch(() => false);
    passed = isValid;
    actualBehavior = isValid
      ? "Field valid after filling"
      : "Field still invalid after filling";
  }

  return [
    {
      fieldLabel: config.label,
      validationType: "required (accepts valid value)",
      inputValue: validValue,
      expectedBehavior: "No error when field has a valid value",
      actualBehavior,
      passed,
    },
  ];
}
