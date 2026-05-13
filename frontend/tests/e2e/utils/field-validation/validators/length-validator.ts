import { Page } from "@playwright/test";
import { FieldConfig, FieldValidationResult } from "../types/field-config";
import {
  assertInlineErrorVisible,
  assertMaxLengthEnforced,
  assertNoInlineError,
} from "../utils/assertion-helpers";
import {
  clearAndBlur,
  fillAndBlur,
  waitAndScrollToField,
} from "../utils/interaction-helpers";
import {
  generateLengthBoundaryValues,
  generateStringOfLength,
} from "../utils/test-data-generators";

/**
 * Validates all string-length based constraints for a single field config:
 * - maxLength   (truncate or inline-error)
 * - minLength   (inline-error)
 * - exactLength (inline-error)
 *
 * Returns one FieldValidationResult per constraint checked.
 */
export async function validateLengthConstraints(
  page: Page,
  config: FieldConfig,
): Promise<FieldValidationResult[]> {
  const results: FieldValidationResult[] = [];
  const locator = page.locator(config.locator).first();
  const mode = config.validationMode ?? "truncate";

  await waitAndScrollToField(locator);

  // ── maxLength ──────────────────────────────────────────────────────────────
  if (config.maxLength !== undefined) {
    const overMax = generateStringOfLength(config.maxLength + 1);
    await fillAndBlur(locator, overMax);

    if (mode === "truncate") {
      await assertMaxLengthEnforced(page, config.locator, config.maxLength);
      const fieldValue = await locator.inputValue();
      const passed = fieldValue.length <= config.maxLength;
      results.push({
        fieldLabel: config.label,
        validationType: "maxLength (truncate)",
        inputValue: overMax,
        expectedBehavior: `Value truncated to ≤ ${config.maxLength} chars`,
        actualBehavior: `Value length is ${fieldValue.length}`,
        passed,
      });
    } else if (mode === "inline-error" && config.errorLocator) {
      await assertInlineErrorVisible(page, config.errorLocator, "");
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        fieldLabel: config.label,
        validationType: "maxLength (inline-error)",
        inputValue: overMax,
        expectedBehavior: `Inline error visible for input > ${config.maxLength} chars`,
        actualBehavior: isVisible ? "Error visible" : "Error NOT visible",
        passed: isVisible,
      });
    }

    // At-max should always be accepted without error
    const atMax = generateStringOfLength(config.maxLength);
    await fillAndBlur(locator, atMax);
    if (mode === "inline-error" && config.errorLocator) {
      await assertNoInlineError(page, config.errorLocator);
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        fieldLabel: config.label,
        validationType: "maxLength (at-max, no error)",
        inputValue: atMax,
        expectedBehavior: "No error at exactly maxLength chars",
        actualBehavior: isVisible ? "Error visible (unexpected)" : "No error",
        passed: !isVisible,
      });
    }
  }

  // ── minLength ──────────────────────────────────────────────────────────────
  if (config.minLength !== undefined && config.minLength > 0) {
    const { belowMin, atMin } = generateLengthBoundaryValues(
      config.minLength,
      config.maxLength ?? config.minLength + 10,
    );

    // Below min — should trigger error
    if (belowMin.length < config.minLength) {
      await fillAndBlur(locator, belowMin);
      if (config.errorLocator) {
        const isVisible = await page
          .locator(config.errorLocator)
          .first()
          .isVisible()
          .catch(() => false);
        await assertInlineErrorVisible(page, config.errorLocator, "");
        results.push({
          fieldLabel: config.label,
          validationType: "minLength (below-min)",
          inputValue: belowMin,
          expectedBehavior: `Error for input < ${config.minLength} chars`,
          actualBehavior: isVisible ? "Error visible" : "Error NOT visible",
          passed: isVisible,
        });
      }
    }

    // At min — should be accepted
    await fillAndBlur(locator, atMin);
    if (config.errorLocator) {
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        fieldLabel: config.label,
        validationType: "minLength (at-min, no error)",
        inputValue: atMin,
        expectedBehavior: `No error at exactly ${config.minLength} chars`,
        actualBehavior: isVisible ? "Error visible (unexpected)" : "No error",
        passed: !isVisible,
      });
    }
  }

  // ── exactLength ────────────────────────────────────────────────────────────
  if (config.exactLength !== undefined) {
    const wrongLength = generateStringOfLength(config.exactLength - 1);
    const correctLength = generateStringOfLength(config.exactLength);

    await fillAndBlur(locator, wrongLength);
    if (config.errorLocator) {
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        fieldLabel: config.label,
        validationType: "exactLength (wrong length)",
        inputValue: wrongLength,
        expectedBehavior: `Error for length ≠ ${config.exactLength}`,
        actualBehavior: isVisible ? "Error visible" : "Error NOT visible",
        passed: isVisible,
      });
    }

    await fillAndBlur(locator, correctLength);
    if (config.errorLocator) {
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);
      results.push({
        fieldLabel: config.label,
        validationType: "exactLength (correct length, no error)",
        inputValue: correctLength,
        expectedBehavior: `No error at exactly ${config.exactLength} chars`,
        actualBehavior: isVisible ? "Error visible (unexpected)" : "No error",
        passed: !isVisible,
      });
    }
  }

  return results;
}
