/**
 * Shared helpers for metadata-driven negative-number validation.
 *
 * Reviewer guide (what logic):
 * 1. Select fields that define negative-number validation metadata.
 * 2. Fill negative values and trigger validation.
 * 3. Assert expected error text on each field.
 * 4. Restore baseline values after each assertion.
 *
 * Tester parameter guide (what to update):
 * - options.negativeValue: numeric input used as invalid value in each field.
 * - options.triggerButtonNames: buttons that trigger validation (e.g., Save/Publish).
 * - options.triggerValidationWithButtonClick: allows blur-only validation checks.
 * - options.pageUrlPattern: optional route assertion after trigger actions.
 */

import { expect, Page } from "@playwright/test";
import { waitForVisibleAndClick } from "tests/e2e/utils/opportunities/interaction-utils";

import { resolveTextLocator } from "./text-locator-utils";

export type NegativeValidationFieldDefinition = {
  valueKey: string;
  selector?: string;
  negativeNumberValidationMessage?: string;
};

export type AssertNegativeNumberValidationsOptions = {
  negativeValue?: string;
  /**
   * Buttons to click for triggering validation.
   * Pass ["No"] to explicitly skip trigger button clicks.
   */
  triggerButtonNames?: string[];
  saveButtonName?: string;
  triggerValidationWithButtonClick?: boolean;
  pageUrlPattern?: RegExp;
};

/**
 * Fills a negative value for all definition-backed fields that declare
 * `negativeNumberValidationMessage`, triggers validation, verifies error text,
 * and restores baseline values.
 */
export async function assertNegativeNumberValidationsFromDefinitions(
  page: Page,
  definitions: NegativeValidationFieldDefinition[],
  fillData: Record<string, string>,
  options?: AssertNegativeNumberValidationsOptions,
): Promise<void> {
  const negativeValue = options?.negativeValue ?? "-10";
  const triggerValidationWithButtonClick =
    options?.triggerValidationWithButtonClick ?? true;
  const triggerButtonNames = options?.triggerButtonNames ?? [
    options?.saveButtonName ?? "Save",
  ];
  const hasNoTriggerSentinel = triggerButtonNames.some(
    (buttonName) => buttonName.toLowerCase() === "no",
  );
  const shouldClickTriggerButtons =
    triggerValidationWithButtonClick && !hasNoTriggerSentinel;

  const negativeValidationFields = definitions.filter(
    (
      field,
    ): field is NegativeValidationFieldDefinition & {
      selector: string;
      negativeNumberValidationMessage: string;
    } => Boolean(field.selector && field.negativeNumberValidationMessage),
  );

  for (const fieldDefinition of negativeValidationFields) {
    const field = page.locator(fieldDefinition.selector);
    await waitForVisibleAndClick(field);
    await field.fill(negativeValue);
    await field.blur();

    const { locator, useContainsText } = await resolveTextLocator({
      page,
      targetKey: fieldDefinition.valueKey,
      expectedContent: fieldDefinition.negativeNumberValidationMessage,
      contextSelector: fieldDefinition.selector,
      includePageLevelFallback: false,
    });

    if (useContainsText) {
      await expect(locator).toContainText(
        fieldDefinition.negativeNumberValidationMessage,
      );
    } else {
      await expect(locator).toHaveText(
        fieldDefinition.negativeNumberValidationMessage,
      );
    }

    if (shouldClickTriggerButtons) {
      for (const triggerButtonName of triggerButtonNames) {
        await page.getByRole("button", { name: triggerButtonName }).click();
        if (options?.pageUrlPattern) {
          await expect(page).toHaveURL(options.pageUrlPattern);
        }
      }
    } else if (options?.pageUrlPattern) {
      await expect(page).toHaveURL(options.pageUrlPattern);
    }

    expect(fillData[fieldDefinition.valueKey]).toBeDefined();
    await field.fill(String(fillData[fieldDefinition.valueKey]));
    await field.blur();
  }
}
