import { expect, type Page } from "@playwright/test";
import { type ValidationMetadata } from "tests/e2e/utils/common/types";

/** Minimum metadata needed to generate and assert character-limit failures. */
type CharacterLimitedField<TValueKey extends string = string> = {
  valueKey: TValueKey;
  maxLength?: number;
} & ValidationMetadata;

/** Returns fields that define a maxLength constraint in metadata. */
export const getCharacterLimitedFields = <
  TValueKey extends string,
  TDefinition extends CharacterLimitedField<TValueKey>,
>(
  definitions: TDefinition[],
): TDefinition[] => {
  return definitions.filter((field) => typeof field.maxLength === "number");
};

/** Resolves the shared character-limit validation message from field metadata. */
export const getCharacterLimitValidationMessage = <
  TValueKey extends string,
  TDefinition extends CharacterLimitedField<TValueKey>,
>(
  definitions: TDefinition[],
): string => {
  const message = getCharacterLimitedFields(definitions)[0]
    ?.characterLimitValidationMessage;

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
  TDefinition extends CharacterLimitedField<TValueKey>,
>(
  definitions: TDefinition[],
  fillData: Record<TValueKey, string>,
): Record<TValueKey, string> => {
  const overLimitFillData = { ...fillData };
  const characterLimitValidationMessage =
    getCharacterLimitValidationMessage(definitions);
  // Keep generated values deterministic by seeding with the first message character.
  const overLimitFillCharacter =
    characterLimitValidationMessage.trim().charAt(0) || "X";

  for (const field of getCharacterLimitedFields(definitions)) {
    overLimitFillData[field.valueKey] = overLimitFillCharacter.repeat(
      (field.maxLength ?? 0) + 1,
    );
  }

  return overLimitFillData;
};

/** Asserts the exact count of visible character-limit validation messages. */
export const assertCharacterLimitMessageCount = async (
  page: Page,
  definitions: CharacterLimitedField[],
  expectedCount: number,
): Promise<void> => {
  const message = getCharacterLimitValidationMessage(definitions);
  await expect(page.getByText(message, { exact: true })).toHaveCount(
    expectedCount,
  );
};
