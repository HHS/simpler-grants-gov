import { expect, type Page } from "@playwright/test";
import {
  type OpportunityFieldValueKey,
  type OpportunityPageFieldDefinition,
} from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";

/** Returns fields that define a maxLength constraint in metadata. */
export const getCharacterLimitedOpportunityFields = (
  definitions: OpportunityPageFieldDefinition[],
): OpportunityPageFieldDefinition[] => {
  return definitions.filter((field) => typeof field.maxLength === "number");
};

/** Resolves the shared character-limit validation message from field metadata. */
export const getCharacterLimitValidationMessage = (
  definitions: OpportunityPageFieldDefinition[],
): string => {
  const message =
    getCharacterLimitedOpportunityFields(definitions)[0]
      ?.characterLimitValidationMessage;

  if (!message) {
    throw new Error(
      "Missing character-limit validation message in create-opportunity field metadata",
    );
  }

  return message;
};

/**
 * Builds over-limit fill data by replacing each character-limited field with a
 * value that exceeds maxLength by one character.
 */
export const buildOverLimitOpportunityFillData = (
  definitions: OpportunityPageFieldDefinition[],
  fillData: Record<OpportunityFieldValueKey, string>,
): Record<OpportunityFieldValueKey, string> => {
  const overLimitFillData = { ...fillData };
  const characterLimitValidationMessage =
    getCharacterLimitValidationMessage(definitions);
  const overLimitFillCharacter =
    characterLimitValidationMessage.trim().charAt(0) || "X";

  for (const field of getCharacterLimitedOpportunityFields(definitions)) {
    overLimitFillData[field.valueKey] = overLimitFillCharacter.repeat(
      (field.maxLength ?? 0) + 1,
    );
  }

  return overLimitFillData;
};

/** Asserts the exact count of visible character-limit validation messages. */
export const assertCharacterLimitMessageCount = async (
  page: Page,
  definitions: OpportunityPageFieldDefinition[],
  expectedCount: number,
): Promise<void> => {
  const message = getCharacterLimitValidationMessage(definitions);
  await expect(page.getByText(message, { exact: true })).toHaveCount(
    expectedCount,
  );
};
