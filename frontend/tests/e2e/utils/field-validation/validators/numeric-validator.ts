import { Page } from "@playwright/test";
import { FieldConfig, FieldValidationResult } from "../types/field-config";
import {
  assertInlineErrorVisible,
  assertNoInlineError,
} from "../utils/assertion-helpers";
import { fillAndBlur, waitAndScrollToField } from "../utils/interaction-helpers";
import { generateNumericBoundaryValues } from "../utils/test-data-generators";

/**
 * Validates numeric boundary constraints (min / max) for a single number input.
 *
 * Checks:
 * - Value below min → error expected
 * - Value at min    → no error expected
 * - Value at max    → no error expected
 * - Value above max → error expected
 *
 * Returns one FieldValidationResult per boundary check.
 */
export async function validateNumericConstraints(
  page: Page,
  config: FieldConfig,
): Promise<FieldValidationResult[]> {
  const results: FieldValidationResult[] = [];

  if (config.min === undefined && config.max === undefined) {
    return results;
  }

  const locator = page.locator(config.locator).first();
  await waitAndScrollToField(locator);

  const min = config.min ?? 0;
  const max = config.max ?? Number.MAX_SAFE_INTEGER;
  const { belowMin, atMin, atMax, aboveMax } = generateNumericBoundaryValues(
    min,
    max,
  );

  const checks: Array<{
    value: number;
    expectError: boolean;
    label: string;
  }> = [
    {
      value: belowMin,
      expectError: true,
      label: `below-min (${belowMin})`,
    },
    {
      value: atMin,
      expectError: false,
      label: `at-min (${atMin})`,
    },
    {
      value: atMax,
      expectError: false,
      label: `at-max (${atMax})`,
    },
    {
      value: aboveMax,
      expectError: true,
      label: `above-max (${aboveMax})`,
    },
  ];

  for (const check of checks) {
    const inputStr = String(check.value);
    await fillAndBlur(locator, inputStr);

    let passed = false;
    let actualBehavior = "";

    if (config.errorLocator) {
      const isVisible = await page
        .locator(config.errorLocator)
        .first()
        .isVisible()
        .catch(() => false);

      if (check.expectError) {
        await assertInlineErrorVisible(page, config.errorLocator, "");
        passed = isVisible;
        actualBehavior = isVisible ? "Error visible" : "Error NOT visible";
      } else {
        await assertNoInlineError(page, config.errorLocator);
        passed = !isVisible;
        actualBehavior = isVisible ? "Error visible (unexpected)" : "No error";
      }
    } else {
      // Without an error locator, check the input's validity state via DOM
      const isValid = await locator
        .evaluate((el) => (el as HTMLInputElement).validity.valid)
        .catch(() => true);
      passed = check.expectError ? !isValid : isValid;
      actualBehavior = isValid ? "Input valid" : "Input invalid";
    }

    results.push({
      fieldLabel: config.label,
      validationType: `numeric (${check.label})`,
      inputValue: inputStr,
      expectedBehavior: check.expectError
        ? `Error for value ${inputStr} (outside [${min}, ${max}])`
        : `No error for value ${inputStr} (inside [${min}, ${max}])`,
      actualBehavior,
      passed,
    });
  }

  return results;
}
