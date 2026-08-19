import { expect, type Page } from "@playwright/test";
import { type ValidationMetadata } from "tests/e2e/utils/common/types";
import {
  fillPageFields,
  type PageFillField,
} from "tests/e2e/utils/pages/general-pages-filling";

type CharacterLimitValidationDefinition<TValueKey extends string> = {
  valueKey: TValueKey;
  selector?: string;
  maxLength?: number;
  maxWords?: number;
} & ValidationMetadata;

/** Returns fields that define a maxLength or maxWords constraint in metadata. */
export const getCharacterLimitedFields = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  definitions: TDefinition[],
): TDefinition[] => {
  // A field participates only when maxLength or maxWords is explicitly numeric.
  // If metadata contains duplicate definitions for the same valueKey, count it once.
  const seen = new Set<string>();
  return definitions.filter((field) => {
    if (
      typeof field.maxLength !== "number" &&
      typeof field.maxWords !== "number"
    ) {
      return false;
    }

    if (seen.has(field.valueKey)) {
      return false;
    }

    seen.add(field.valueKey);
    return true;
  });
};

const getValidationLimitValue = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  field: TDefinition,
): number => {
  return field.maxWords ?? field.maxLength ?? 0;
};

const buildOverLimitWordValue = (maxWords: number, fillCharacter: string) => {
  if (maxWords <= 0) {
    return fillCharacter;
  }

  return Array(maxWords + 1)
    .fill(fillCharacter)
    .join(" ");
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
  // Start from baseline fill data and override only limited fields.
  const overLimitFillData = { ...fillData };
  const characterLimitValidationMessage =
    getCharacterLimitValidationMessage(definitions);
  // Keep generated values deterministic by seeding with the first message character.
  const overLimitFillCharacter =
    characterLimitValidationMessage.trim().charAt(0) || "X";

  for (const field of getCharacterLimitedFields(definitions)) {
    const limitValue = getValidationLimitValue(field);

    if (typeof field.maxWords === "number") {
      overLimitFillData[field.valueKey] = buildOverLimitWordValue(
        field.maxWords,
        overLimitFillCharacter,
      );
      continue;
    }

    overLimitFillData[field.valueKey] = overLimitFillCharacter.repeat(
      limitValue + 1,
    );
  }

  return overLimitFillData;
};

const getLocatorForMessage = <
  TValueKey extends string,
  TDefinition extends CharacterLimitValidationDefinition<TValueKey>,
>(
  page: Page,
  definitions: TDefinition[],
  message: string,
) => {
  const wordLimitField = definitions.find(
    (field) =>
      field.characterLimitValidationMessage === message &&
      typeof field.maxWords === "number",
  );

  if (wordLimitField) {
    return page.getByRole("alert").filter({ hasText: message });
  }

  return page.getByTestId("characterCountMessage").filter({ hasText: message });
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
  const counts = new Map<string, number>();
  const limitedFields = getCharacterLimitedFields(definitions);

  for (const field of limitedFields) {
    const message =
      field.characterLimitValidationMessage ||
      getCharacterLimitValidationMessage(definitions);
    counts.set(message, (counts.get(message) ?? 0) + 1);
  }

  const actualCount = Array.from(counts.values()).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (actualCount !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} character-limit validation messages, but found ${actualCount}.`,
    );
  }

  for (const [message, count] of counts.entries()) {
    await expect(getLocatorForMessage(page, definitions, message)).toHaveCount(
      count,
    );
  }
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

  for (const field of getCharacterLimitedFields(definitions)) {
    if (field.selector) {
      const locator = page.locator(field.selector).first();
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.click();
      await locator.blur();
    }
  }

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
