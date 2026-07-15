import { expect, type Page } from "@playwright/test";
import {
  assertCharacterLimitMessageCount,
  buildOverLimitFillData,
  getCharacterLimitedFields,
} from "tests/e2e/utils/common/character-limit-fill-data-utils";
import { type PageFillField, fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";
import { type ValidationMetadata } from "tests/e2e/utils/common/types";

type CharacterLimitValidationDefinition<TValueKey extends string> = {
  valueKey: TValueKey;
  maxLength?: number;
} & ValidationMetadata;

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
