/**
 * Shared helpers for metadata-driven email validation.
 *
 * Reviewer guide (what logic):
 * 1. Select fields that declare `emailValidationMessage`.
 * 2. Fill an invalid email value and trigger validation.
 * 3. Assert expected email-validation text.
 * 4. Restore baseline values after each assertion.
 */

import { expect, type Page } from "@playwright/test";

import { clickAndFill, waitForVisibleAndClick } from "./interaction-utils";
import { resolveTextLocator } from "./text-locator-utils";

export type EmailValidationFieldDefinition = {
  valueKey: string;
  selector?: string;
  emailValidationMessage?: string;
};

export type AssertEmailValidationsOptions = {
  invalidEmail?: string;
  triggerButtonNames?: string[];
  pageUrlPattern?: RegExp;
};

const toKebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const resolveFieldLocatorSelector = (
  fieldDefinition: EmailValidationFieldDefinition,
): string => fieldDefinition.selector ?? `#${fieldDefinition.valueKey}`;

/**
 * Fills invalid email values for metadata-backed fields, triggers validation,
 * verifies error text, and restores baseline values.
 */
export async function assertEmailValidationsFromDefinitions(
  page: Page,
  definitions: EmailValidationFieldDefinition[],
  fillData: Record<string, string>,
  options?: AssertEmailValidationsOptions,
): Promise<void> {
  const invalidEmail = options?.invalidEmail ?? "ABC";
  const triggerButtonNames = options?.triggerButtonNames ?? ["Save"];

  const emailValidationFields = definitions.filter(
    (
      field,
    ): field is EmailValidationFieldDefinition & {
      emailValidationMessage: string;
    } => Boolean(field.emailValidationMessage),
  );

  for (const fieldDefinition of emailValidationFields) {
    const selector = resolveFieldLocatorSelector(fieldDefinition);
    let field = page.locator(selector);

    if (!(await field.count())) {
      const kebabSelector = `#${toKebabCase(fieldDefinition.valueKey)}`;
      field = page.locator(kebabSelector);
    }

    await clickAndFill(field, invalidEmail);

    const clickTarget = page.locator("main").first();
    if (await clickTarget.count()) {
      await waitForVisibleAndClick(clickTarget);
    } else {
      const body = page.locator("body").first();
      await waitForVisibleAndClick(body);
    }

    await field.blur();

    for (const triggerButtonName of triggerButtonNames) {
      await page.getByRole("button", { name: triggerButtonName }).click();
      if (options?.pageUrlPattern) {
        await expect(page).toHaveURL(options.pageUrlPattern);
      }
    }

    const { locator, useContainsText } = await resolveTextLocator({
      page,
      targetKey: fieldDefinition.valueKey,
      expectedContent: fieldDefinition.emailValidationMessage,
      contextSelector: selector,
      includePageLevelFallback: false,
    });

    if (useContainsText) {
      await expect(locator).toContainText(
        fieldDefinition.emailValidationMessage,
      );
    } else {
      await expect(locator).toHaveText(fieldDefinition.emailValidationMessage);
    }

    expect(fillData[fieldDefinition.valueKey]).toBeDefined();
    await field.fill(String(fillData[fieldDefinition.valueKey]));
    await field.blur();
  }
}
