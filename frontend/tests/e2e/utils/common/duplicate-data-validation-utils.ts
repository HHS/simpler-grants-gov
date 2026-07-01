import { expect, type Page } from "@playwright/test";

/**
 * Builds a case-insensitive duplicate-validation regex by injecting an escaped value
 * into a metadata-provided pattern.
 */
export const buildDuplicateDataRegex = (
  duplicatePattern: string,
  value: string,
  placeholder = "{{value}}",
): RegExp => {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(duplicatePattern.replace(placeholder, escapedValue), "i");
};

export const buildDuplicateDataRegexFromDefinitions = <
  T extends { valueKey: string },
>(
  definitions: T[],
  valueKey: string,
  value: string,
  getPattern: (definition: T) => string | undefined,
  placeholder = "{{value}}",
): RegExp => {
  const definition = definitions.find(
    (currentDefinition) => currentDefinition.valueKey === valueKey,
  );
  const resolvedPattern = definition ? getPattern(definition) : undefined;

  if (!resolvedPattern) {
    throw new Error(
      `Missing duplicate validation pattern in field metadata for value key: ${valueKey}`,
    );
  }

  return buildDuplicateDataRegex(resolvedPattern, value, placeholder);
};

/** Metadata contract for fields that can emit duplicate-validation messages. */
export type DuplicateValidationField = {
  valueKey: string;
  duplicateValidationPattern?: string;
};

/** Builds a duplicate-validation regex for a single field keyed by valueKey. */
export const buildDuplicateDataRegexForField = (
  definitions: DuplicateValidationField[],
  valueKey: string,
  value: string,
): RegExp => {
  const definition = definitions.find(
    (currentDefinition) => currentDefinition.valueKey === valueKey,
  );
  const duplicatePattern = definition?.duplicateValidationPattern;

  if (!duplicatePattern) {
    throw new Error(
      `Missing duplicate validation pattern in field metadata for value key: ${valueKey}`,
    );
  }

  return buildDuplicateDataRegex(duplicatePattern, value);
};

/** Builds duplicate-validation regexes for all metadata-enabled duplicate fields. */
export const buildDuplicateDataRegexesForDefinitions = <
  T extends DuplicateValidationField,
>(
  definitions: T[],
  valuesByKey: Record<string, string>,
): RegExp[] => {
  const duplicateValidationDefinitions = definitions.filter(
    (definition) => !!definition.duplicateValidationPattern,
  );

  if (duplicateValidationDefinitions.length === 0) {
    throw new Error(
      "No duplicate validation patterns were found in the provided field definitions",
    );
  }

  return duplicateValidationDefinitions.map((definition) => {
    const value = valuesByKey[definition.valueKey];

    if (!value) {
      throw new Error(
        `Missing value for duplicate validation field key: ${definition.valueKey}`,
      );
    }

    return buildDuplicateDataRegex(
      definition.duplicateValidationPattern as string,
      value,
    );
  });
};

/** Asserts all expected duplicate-validation messages are visible on the page. */
export const assertDuplicateValidationMessages = async <
  T extends DuplicateValidationField,
>(
  page: Page,
  definitions: T[],
  valuesByKey: Record<string, string>,
): Promise<void> => {
  const duplicateValidationRegexes = buildDuplicateDataRegexesForDefinitions(
    definitions,
    valuesByKey,
  );

  for (const duplicateValidationRegex of duplicateValidationRegexes) {
    await expect(
      page.getByText(duplicateValidationRegex).first(),
    ).toBeVisible();
  }
};
