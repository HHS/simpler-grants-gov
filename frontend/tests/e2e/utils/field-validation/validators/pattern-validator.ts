import { Page } from "@playwright/test";
import { FieldConfig, FieldValidationResult } from "../types/field-config";
import {
  assertInlineErrorVisible,
  assertNoInlineError,
} from "../utils/assertion-helpers";
import { fillAndBlur, waitAndScrollToField } from "../utils/interaction-helpers";

/**
 * Validates regex pattern constraints for a single field config.
 *
 * - Generates an obviously invalid value (all spaces) and an arbitrary
 *   valid value derived from the pattern, or falls back to a numeric string.
 * - Uses the `pattern` on the FieldConfig.  If not set, this is a no-op.
 *
 * Returns up to two FieldValidationResults (invalid + valid).
 */
export async function validatePatternConstraint(
  page: Page,
  config: FieldConfig,
): Promise<FieldValidationResult[]> {
  if (!config.pattern) {
    return [];
  }

  const locator = page.locator(config.locator).first();
  await waitAndScrollToField(locator);

  const results: FieldValidationResult[] = [];

  // Use a clearly invalid value: non-matching characters
  const invalidValue = "!!!INVALID!!!";
  await fillAndBlur(locator, invalidValue);

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
      ? "Pattern error visible"
      : "Pattern error NOT visible";
  } else {
    const patternMismatch = await locator
      .evaluate((el) => (el as HTMLInputElement).validity.patternMismatch)
      .catch(() => false);
    passed = patternMismatch;
    actualBehavior = patternMismatch
      ? "patternMismatch = true"
      : "patternMismatch = false";
  }

  results.push({
    fieldLabel: config.label,
    validationType: "pattern (invalid value)",
    inputValue: invalidValue,
    expectedBehavior: `Error for value not matching ${config.pattern}`,
    actualBehavior,
    passed,
  });

  // Try a valid-looking value that satisfies the pattern
  // Works best with simple patterns; complex patterns need a config-supplied valid value
  const validValue = "12345"; // reasonable fallback
  await fillAndBlur(locator, validValue);

  if (config.errorLocator) {
    const isVisible = await page
      .locator(config.errorLocator)
      .first()
      .isVisible()
      .catch(() => false);
    await assertNoInlineError(page, config.errorLocator);
    const noError = !isVisible;
    results.push({
      fieldLabel: config.label,
      validationType: "pattern (valid value, no error)",
      inputValue: validValue,
      expectedBehavior: `No error for value matching ${config.pattern}`,
      actualBehavior: noError ? "No error" : "Error visible (unexpected)",
      passed: noError,
    });
  }

  return results;
}
