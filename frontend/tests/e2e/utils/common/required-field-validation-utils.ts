import { expect, type Page } from "@playwright/test";

import {
  type MetadataPageFieldDefinition,
  type ValidationMetadata,
} from "./types";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Shared helpers for metadata-driven required-field validation assertions.
 *
 * Reviewer guide (what logic):
 * 1. Pick only fields marked as required.
 * 2. Keep only fields that provide a required-field message.
 * 3. Convert to a reusable RequiredFieldError[] shape.
 *
 * Tester parameter guide (what to update):
 * - definitions: metadata source of required fields and messages.
 * - fieldIdResolver: optional override when field id differs from valueKey.
 */

/** Minimum metadata needed to build required-field error assertions. */
type RequiredValidationField<TValueKey extends string = string> =
  MetadataPageFieldDefinition<TValueKey> & ValidationMetadata;

export type RequiredFieldError = {
  fieldId: string;
  message: string;
};

export type AssertRequiredFieldValidationsOptions = {
  triggerButtonNames?: string[];
  saveButtonName?: string;
  pageUrlPattern?: RegExp;
  verifyAlertLinkMappings?: boolean;
};

/** Returns required fields that provide a required-field validation message. */
export const getRequiredValidationFields = <
  TValueKey extends string,
  TDefinition extends RequiredValidationField<TValueKey>,
>(
  definitions: TDefinition[],
): Array<TDefinition & { requiredFieldMessage: string }> => {
  return definitions.filter(
    (field): field is TDefinition & { requiredFieldMessage: string } =>
      Boolean(field.required && field.requiredFieldMessage),
  );
};

/**
 * Builds RequiredFieldError[] for required-field checks from metadata definitions.
 * Defaults fieldId to valueKey unless a resolver is provided.
 */
export const buildRequiredFieldErrorsFromDefinitions = <
  TValueKey extends string,
  TDefinition extends RequiredValidationField<TValueKey>,
>(
  definitions: TDefinition[],
  fieldIdResolver?: (
    field: TDefinition & { requiredFieldMessage: string },
  ) => string,
): RequiredFieldError[] => {
  return getRequiredValidationFields(definitions).map((field) => ({
    fieldId: fieldIdResolver ? fieldIdResolver(field) : field.valueKey,
    message: field.requiredFieldMessage,
  }));
};

/**
 * Fills required-field validation by clicking configured trigger buttons and asserting errors.
 * Mirrors the negative-number helper pattern: definitions in, validation behavior out.
 */
export async function assertRequiredFieldValidationsFromDefinitions(
  page: Page,
  definitions: RequiredValidationField[],
  options?: AssertRequiredFieldValidationsOptions,
): Promise<void> {
  const triggerButtonNames = options?.triggerButtonNames ?? [
    options?.saveButtonName ?? "Save",
  ];
  const requiredFieldErrors =
    buildRequiredFieldErrorsFromDefinitions(definitions);

  const hasNoTriggerSentinel = triggerButtonNames.some(
    (buttonName) => buttonName.toLowerCase() === "no",
  );

  for (const triggerButtonName of triggerButtonNames) {
    if (!hasNoTriggerSentinel) {
      await page.getByRole("button", { name: triggerButtonName }).click();
    }

    if (options?.pageUrlPattern) {
      await expect(page).toHaveURL(options.pageUrlPattern);
    }

    const errorSummary = page
      .getByRole("heading", { name: /Error\(s\) Found/i })
      .locator("..");
    await expect(errorSummary).toBeVisible();

    for (const definition of getRequiredValidationFields(definitions)) {
      await expect(errorSummary).toContainText(definition.requiredFieldMessage);

      let inlineErrorScope;

      if (definition.inlineErrorSelector) {
        inlineErrorScope = page.locator(definition.inlineErrorSelector).first();
      } else if (definition.selector) {
        const selectorField = page.locator(definition.selector).first();
        if ((await selectorField.count()) > 0) {
          inlineErrorScope = selectorField.locator(
            'xpath=ancestor::*[@data-testid="formGroup"][1]',
          );
        } else {
          // Field IDs can change as forms evolve; label lookup is more stable.
          const fieldByLabel = page
            .getByLabel(new RegExp(`^${escapeRegExp(definition.label)}\\*?$`, "i"))
            .first();
          if ((await fieldByLabel.count()) > 0) {
            inlineErrorScope = fieldByLabel.locator(
              'xpath=ancestor::*[@data-testid="formGroup"][1]',
            );
          } else {
            inlineErrorScope = page
              .getByRole("alert")
              .filter({ hasText: definition.requiredFieldMessage })
              .first();
          }
        }
      } else {
        inlineErrorScope = page
          .getByRole("alert")
          .filter({ hasText: definition.requiredFieldMessage })
          .first();
      }

      await expect(inlineErrorScope).toContainText(
        definition.requiredFieldMessage,
      );
    }

    if (options?.verifyAlertLinkMappings) {
      const alertErrorLinks = errorSummary.locator('a[href*="error-for-"]');
      const actualLinkedFieldIds = (
        await alertErrorLinks.evaluateAll((nodes) =>
          nodes
            .map((node) => {
              const href = node.getAttribute("href") ?? "";
              const match = href.match(/#?error-for-(.+)$/);
              return match?.[1] ?? "";
            })
            .filter(Boolean),
        )
      ).sort();
      const expectedFieldIds = requiredFieldErrors
        .map(({ fieldId }) => fieldId)
        .sort();
      expect(actualLinkedFieldIds).toEqual(expectedFieldIds);
    }
  }
}
