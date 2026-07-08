/**
 * Shared helpers for metadata-driven cross-field validation.
 *
 * Reviewer guide (what logic):
 * 1. Fill invalid values for each cross-field scenario.
 * 2. Trigger validation using configured buttons.
 * 3. Resolve expected errors from metadata and assert messages.
 * 4. Restore baseline values before the next scenario.
 *
 * Tester parameter guide (what to update):
 * - definitions: set invalid pair/group inputs and expected messages.
 * - fillData: baseline values used to restore fields after each scenario.
 * - options.triggerButtonNames: controls which actions trigger validation (Save/Publish).
 * - options.pageUrlPattern: optional route assertion after each trigger click.
 */

import { expect, Page } from "@playwright/test";
import { resolveTextLocator } from "./text-locator-utils";

export type CrossFieldValidationDefinition = {
  name: string;
  fieldsToSet: Array<{
    selector: string;
    valueKey: string;
    invalidValue: string;
    expectedErrorMessage?: string;
  }>;
  expectedErrors?: Array<{
    valueKey: string;
    message: string;
  }>;
};

export type AssertCrossFieldValidationsOptions = {
  triggerButtonNames?: string[];
  pageUrlPattern?: RegExp;
};

/**
 * Applies each cross-field invalid scenario from metadata,
 * triggers validation, verifies expected field-level errors, then restores baseline values.
 */
export async function assertCrossFieldValidationsFromDefinitions(
  page: Page,
  definitions: CrossFieldValidationDefinition[],
  fillData: Record<string, string>,
  options?: AssertCrossFieldValidationsOptions,
): Promise<void> {
  const triggerButtonNames = options?.triggerButtonNames ?? ["Save"];

  for (const definition of definitions) {
    for (const field of definition.fieldsToSet) {
      await page.locator(field.selector).fill(field.invalidValue);
      await page.locator(field.selector).blur();
    }

    for (const triggerButtonName of triggerButtonNames) {
      await page.getByRole("button", { name: triggerButtonName }).click();
      if (options?.pageUrlPattern) {
        await expect(page).toHaveURL(options.pageUrlPattern);
      }
    }

    const expectedErrors =
      definition.expectedErrors ??
      definition.fieldsToSet
        .filter((field) => Boolean(field.expectedErrorMessage))
        .map((field) => ({
          valueKey: field.valueKey,
          message: String(field.expectedErrorMessage),
        }));

    if (!expectedErrors.length) {
      throw new Error(
        `Cross-field validation definition "${definition.name}" is missing expected errors. Provide expectedErrors or fieldsToSet.expectedErrorMessage.`,
      );
    }

    for (const expectedError of expectedErrors) {
      const fieldSelector = definition.fieldsToSet.find(
        (field) => field.valueKey === expectedError.valueKey,
      )?.selector;
      const { locator, useContainsText } = await resolveTextLocator({
        page,
        targetKey: expectedError.valueKey,
        expectedContent: expectedError.message,
        contextSelector: fieldSelector,
        includePageLevelFallback: true,
      });

      if (useContainsText) {
        await expect(locator).toContainText(expectedError.message);
      } else {
        await expect(locator).toHaveText(expectedError.message);
      }
    }

    for (const field of definition.fieldsToSet) {
      expect(fillData[field.valueKey]).toBeDefined();
      await page.locator(field.selector).fill(String(fillData[field.valueKey]));
      await page.locator(field.selector).blur();
    }
  }
}
