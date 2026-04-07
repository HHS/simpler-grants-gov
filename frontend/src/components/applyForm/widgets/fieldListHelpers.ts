import { FormattedFormValidationWarning } from "src/components/applyForm/types";

/**
 * Returns validation warnings that apply to the FieldList as a whole.
 *
 * These include array-level validation issues (e.g. minItems, maxItems)
 * that are associated with the FieldList field itself.
 *
 * Child field warnings are excluded by filtering out any warnings that
 * include a `definition`, since those represent nested field errors.
 *
 * Results are deduplicated to avoid rendering duplicate messages.
 */

export function getFieldListGroupErrors({
  rawErrors,
  fieldListPath,
}: {
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
}): FormattedFormValidationWarning[] {
  if (!rawErrors?.length) {
    return [];
  }

  const uniqueWarnings = new Map<string, FormattedFormValidationWarning>();

  rawErrors
    .filter((warning) => warning.field === fieldListPath && !warning.definition)
    .forEach((warning) => {
      const warningKey = `${warning.field}-${warning.message}`;
      if (!uniqueWarnings.has(warningKey)) {
        uniqueWarnings.set(warningKey, warning);
      }
    });

  return Array.from(uniqueWarnings.values());
}

/**
 * Returns validation messages for a specific child field within a specific
 * FieldList row.
 *
 * Row-aware warnings are matched first using the indexed warning path
 * (for example `$.contact_people_test[1].first_name`) so that identical
 * child fields across different rows do not share the same error state.
 *
 * If a warning does not include row-aware path information, the helper
 * falls back to matching by the child's schema `definition`.
 *
 * Results are deduplicated to prevent duplicate messages from rendering.
 */

export function getFieldListChildErrors({
  rawErrors,
  fieldListPath,
  rowIndex,
  storageKey,
  childDefinition,
}: {
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
  rowIndex: number;
  storageKey: string;
  childDefinition: string;
}): string[] {
  if (!rawErrors?.length) {
    return [];
  }

  const rowAwareFieldPath = `${fieldListPath}[${rowIndex}].${storageKey}`;

  return Array.from(
    new Set(
      rawErrors
        .filter((warning) => {
          if (warning.field === rowAwareFieldPath) {
            return true;
          }

          // Checks if the warning field includes a row index (e.g. [1])
          const hasIndexedFieldPath = /\[\d+\]/.test(warning.field);

          if (hasIndexedFieldPath) {
            return false;
          }

          return warning.definition === childDefinition;
        })
        .map((warning) => warning.formatted ?? warning.message),
    ),
  );
}
