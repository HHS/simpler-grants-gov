import { expect, type Page } from "@playwright/test";
import { escapeRegex } from "tests/e2e/utils/common/regex-utils";
import { type DuplicateValidationMetadata } from "tests/e2e/utils/common/types";

/**
 * Shared helpers for duplicate-data validation.
 *
 * How this file works:
 * - Build duplicate-message regexes from metadata patterns and runtime values.
 * - Resolve one or many field-level duplicate regex expectations.
 * - Assert duplicate validation messages are visible on the page.
 *
 * Builds a case-insensitive duplicate-validation regex by injecting an escaped value
 * into a metadata-provided pattern.
 */
export const buildDuplicateDataRegex = (
  duplicatePattern: string,
  value: string,
  placeholder = "{{value}}",
): RegExp => {
  // Escape user/test data so regex special characters are treated as literal input.
  const escapedValue = escapeRegex(value);

  return new RegExp(duplicatePattern.replace(placeholder, escapedValue), "i");
};

/**
 * Resolves a field definition by value key, reads its duplicate-pattern metadata,
 * and builds the expected duplicate-validation regex.
 */
export const buildDuplicateDataRegexFromDefinitions = <
  T extends { valueKey: string },
>(
  definitions: T[],
  valueKey: string,
  value: string,
  getPattern: (definition: T) => string | undefined,
  placeholder = "{{value}}",
): RegExp => {
  // Resolve the metadata definition for the requested value key.
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
} & DuplicateValidationMetadata;

/** Builds a duplicate-validation regex for a single field keyed by valueKey. */
export const buildDuplicateDataRegexForField = (
  definitions: DuplicateValidationField[],
  valueKey: string,
  value: string,
): RegExp => {
  // Resolve one duplicate-enabled field definition by key.
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
  // Only fields with duplicate patterns participate in duplicate-message assertions.
  const duplicateValidationDefinitions = definitions.filter(
    (definition) => !!definition.duplicateValidationPattern,
  );

  if (duplicateValidationDefinitions.length === 0) {
    throw new Error(
      "No duplicate validation patterns were found in the provided field definitions",
    );
  }

  // Build one regex per duplicate-enabled field using its mapped runtime value.
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
  // Build all expected duplicate-message regexes from metadata + values.
  const duplicateValidationRegexes = buildDuplicateDataRegexesForDefinitions(
    definitions,
    valuesByKey,
  );

  // Assert every expected duplicate message is visible to confirm validation coverage.
  for (const duplicateValidationRegex of duplicateValidationRegexes) {
    await expect(
      page.getByText(duplicateValidationRegex).first(),
    ).toBeVisible();
  }
};
