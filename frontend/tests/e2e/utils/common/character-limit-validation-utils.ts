import { expect, type Page } from "@playwright/test";
import { type ValidationMetadata } from "tests/e2e/utils/common/types";
import {
  fillPageFields,
  type PageFillField,
} from "tests/e2e/utils/pages/general-pages-filling";

type CharacterLimitValidationDefinition<TValueKey extends string> = {
  valueKey: TValueKey;
  maxLength?: number;
} & ValidationMetadata;

/** Returns fields that define a maxLength constraint in metadata. */
export const getCharacterLimitedFields = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  definitions: TDefinition[],
): TDefinition[] => {
  // A field participates only when maxLength is explicitly numeric.
  return definitions.filter((field) => typeof field.maxLength === "number");
};

/** Resolves the shared character-limit validation message from field metadata. */
export const getCharacterLimitValidationMessage = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  definitions: TDefinition[],
): string => {
  // Reuse the first character-limited field as the canonical message source.
  const message =
    getCharacterLimitedFields(definitions)[0]?.characterLimitValidationMessage;

  if (!message) {
    throw new Error(
      "Missing character-limit validation message in field metadata",
    );
  }

  return message;
};

/**
 * Builds over-limit fill data by replacing each character-limited field with a
 * value that exceeds maxLength by one character.
 */
export const buildOverLimitFillData = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  definitions: TDefinition[],
  fillData: Record<TValueKey, string>,
): Record<TValueKey, string> => {
  // Start from baseline fill data and override only character-limited fields.
  const overLimitFillData = { ...fillData };
  const characterLimitValidationMessage =
    getCharacterLimitValidationMessage(definitions);
  // Keep generated values deterministic by seeding with the first message character.
  const overLimitFillCharacter =
    characterLimitValidationMessage.trim().charAt(0) || "X";

  // For each constrained field, generate a value that is exactly one char over maxLength.
  for (const field of getCharacterLimitedFields(definitions)) {
    overLimitFillData[field.valueKey] = overLimitFillCharacter.repeat(
      (field.maxLength ?? 0) + 1,
    );
  }

  return overLimitFillData;
};

/** Asserts the exact count of visible character-limit validation messages. */
export const assertCharacterLimitMessageCount = async <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  page: Page,
  definitions: TDefinition[],
  expectedCount: number,
): Promise<void> => {
  // Assert occurrences in the field status element only, excluding SR/live-region duplicates.
  const message = getCharacterLimitValidationMessage(definitions);
  await expect(
    page.getByTestId("characterCountMessage").filter({ hasText: message }),
  ).toHaveCount(expectedCount);
};

export type AssertCharacterLimitValidationsOptions<
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
> = {
  triggerButtonNames?: string[];
  pageUrlPattern?: RegExp;
  buildPageFields: (
    definitions: TDefinition[],
    fillData: Record<TValueKey, string>,
  ) => PageFillField[];
};

/**
 * Fills over-limit values from metadata, triggers validation, and asserts
 * character-limit message count for all character-limited fields.
 */
export async function assertCharacterLimitValidationsFromDefinitions<
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  page: Page,
  definitions: TDefinition[],
  fillData: Record<TValueKey, string>,
  options: AssertCharacterLimitValidationsOptions<TValueKey, TDefinition>,
): Promise<void> {
  await fillPageFields(
    page,
    options.buildPageFields(
      definitions,
      buildOverLimitFillData(definitions, fillData),
    ),
  );

  const triggerButtonNames = options.triggerButtonNames ?? ["Save"];
  for (const triggerButtonName of triggerButtonNames) {
    await page.getByRole("button", { name: triggerButtonName }).click();
    if (options.pageUrlPattern) {
      await expect(page).toHaveURL(options.pageUrlPattern);
    }
  }

  await assertCharacterLimitMessageCount(
    page,
    definitions,
    getCharacterLimitedFields(definitions).length,
  );
}
