import { type Page } from "@playwright/test";
import {
  fillPageFields,
  type PageFillField,
} from "tests/e2e/utils/pages/general-pages-filling";

type DefinitionWithValueKey = {
  valueKey: string;
};

/**
 * Builds a fill-data object with empty strings for each unique metadata valueKey.
 */
export const buildEmptyFillDataFromDefinitions = <
  TDefinition extends DefinitionWithValueKey,
>(
  definitions: TDefinition[],
): Record => {
  const uniqueValueKeys = Array.from(
    new Set(definitions.map((definition) => definition.valueKey)),
  );

  return uniqueValueKeys.reduce<Record>((fillData, valueKey) => {
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
  TFillData extends Record,
>(
  page: Page,
  definitions: TDefinition[],
  buildPageFields: (
    definitions: TDefinition[],
    fillData: TFillData,
  ) => PageFillField[],
): Promise => {
  const emptyFillData = buildEmptyFillDataFromDefinitions(
    definitions,
  ) as TFillData;

  await fillPageFields(page, buildPageFields(definitions, emptyFillData));
};
