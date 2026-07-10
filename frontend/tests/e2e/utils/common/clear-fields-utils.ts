import { type Page } from "@playwright/test";
import {
  fillPageFields,
  type PageFillField,
} from "tests/e2e/utils/pages/general-pages-filling";

/**
 * Shared utilities for clearing metadata-driven page fields.
 *
 * How this file works:
 * - Derive unique value keys from field metadata definitions.
 * - Build an empty fill-data object keyed by those value keys.
 * - Reuse page-field builders + shared fill routine to clear fields on the page.
 */

type DefinitionWithValueKey = {
  valueKey: string;
};

type StringByKey = {
  [key: string]: string;
};

/**
 * Builds a fill-data object with empty strings for each unique metadata valueKey.
 */
export const buildEmptyFillDataFromDefinitions = <
  TDefinition extends DefinitionWithValueKey,
>(
  definitions: TDefinition[],
): StringByKey => {
  // One empty value is needed per unique valueKey, even if multiple fields share a key.
  const uniqueValueKeys = Array.from(
    new Set(definitions.map((definition) => definition.valueKey)),
  );

  // Build a reusable empty fill-data map consumed by metadata-driven field builders.
  return uniqueValueKeys.reduce<StringByKey>((fillData, valueKey) => {
    fillData[valueKey] = "";
    return fillData;
  }, {});
};

/**
 * Clears page fields by generating empty fill data from definitions and applying
 * the existing page-field builder + shared fill routine.
 */
export const clearPageFieldsFromDefinitions = async <
  TDefinition extends DefinitionWithValueKey,
  TFillData extends StringByKey,
>(
  page: Page,
  definitions: TDefinition[],
  buildPageFields: (
    definitions: TDefinition[],
    fillData: TFillData,
  ) => PageFillField[],
) => {
  // Convert metadata definitions into an empty fill-data payload for clearing.
  const emptyFillData = buildEmptyFillDataFromDefinitions(
    definitions,
  ) as TFillData;

  // Reuse existing fill pipeline so clear behavior stays consistent with normal filling.
  await fillPageFields(page, buildPageFields(definitions, emptyFillData));
};
