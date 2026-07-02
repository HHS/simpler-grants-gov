import { type Page } from "@playwright/test";
import {
  fillPageFields,
  type PageFillField,
} from "tests/e2e/utils/pages/general-pages-filling";

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
  const uniqueValueKeys = Array.from(
    new Set(definitions.map((definition) => definition.valueKey)),
  );

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
  const emptyFillData = buildEmptyFillDataFromDefinitions(
    definitions,
  ) as TFillData;

  await fillPageFields(page, buildPageFields(definitions, emptyFillData));
};
