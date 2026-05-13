import { Page } from "@playwright/test";
import { FieldConfig, FieldValidationResult } from "../types/field-config";
import {
  assertInlineErrorVisible,
  assertNoInlineError,
} from "../utils/assertion-helpers";
import { fillAndBlur, waitAndScrollToField } from "../utils/interaction-helpers";
import { generateTypeSpecificInvalidValues } from "../utils/test-data-generators";

/**
 * Validates that a field only accepts input appropriate for its declared type.
 *
 * For typed fields (`email`, `tel`, `number`):
 *   - Probes a set of clearly-wrong-for-that-type strings and asserts each one
 *     is rejected — either via a visible inline error element or via the native
 *     browser validity API (`validity.typeMismatch`, `validity.patternMismatch`,
 *     or `validity.valid === false`).
 *
 * For free-text fields (`text`, `textarea`):
 *   - Probes XSS/SQL-injection/Unicode payloads and asserts each one is
 *     accepted verbatim — verifying no client-side sanitization silently strips
 *     or mutates the value before it reaches the server.
 *
 * Returns one FieldValidationResult per probe.
 */
export async function validateTypeInputConstraints(
  page: Page,
  config: FieldConfig,
): Promise<FieldValidationResult[]> {
  const probes = generateTypeSpecificInvalidValues(config.type);
  if (probes.length === 0) return [];

  const results: FieldValidationResult[] = [];
  const locator = page.locator(config.locator).first();
  await waitAndScrollToField(locator);

  for (const probe of probes) {
    await fillAndBlur(locator, probe.value);

    if (probe.expectRejection) {
      // ── Typed fields: input should be rejected ─────────────────────────────
      if (config.errorLocator) {
        const isVisible = await page
          .locator(config.errorLocator)
          .first()
          .isVisible()
          .catch(() => false);
        await assertInlineErrorVisible(page, config.errorLocator, "");
        results.push({
          fieldLabel: config.label,
          validationType: `type-invalid input (${probe.description})`,
          inputValue: probe.value,
          expectedBehavior: `Inline error visible for invalid ${config.type} input`,
          actualBehavior: isVisible ? "Error visible" : "Error NOT visible",
          passed: isVisible,
        });
      } else {
        // Fall back to the native browser validity state
        const isInvalid = await locator
          .evaluate((el) => {
            const input = el as HTMLInputElement;
            return (
              input.validity.typeMismatch ||
              input.validity.patternMismatch ||
              !input.validity.valid
            );
          })
          .catch(() => false);
        results.push({
          fieldLabel: config.label,
          validationType: `type-invalid input (${probe.description})`,
          inputValue: probe.value,
          expectedBehavior: `Field marked invalid for non-${config.type} input`,
          actualBehavior: isInvalid
            ? "Field marked invalid"
            : "Field accepted invalid input (unexpected)",
          passed: isInvalid,
        });
      }
    } else {
      // ── Free-text fields: input should be accepted verbatim ────────────────
      const storedValue = await locator.inputValue().catch(() => "");
      const accepted = storedValue === probe.value;

      if (config.errorLocator) {
        await assertNoInlineError(page, config.errorLocator);
      }

      results.push({
        fieldLabel: config.label,
        validationType: `special-char accepted (${probe.description})`,
        inputValue: probe.value,
        expectedBehavior: "Value stored verbatim (no client-side sanitization)",
        actualBehavior: accepted
          ? "Value accepted and stored correctly"
          : `Value mutated or rejected — got: "${storedValue}"`,
        passed: accepted,
      });
    }
  }

  return results;
}
