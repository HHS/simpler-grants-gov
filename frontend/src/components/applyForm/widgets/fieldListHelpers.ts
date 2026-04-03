import { FormattedFormValidationWarning } from "../types";

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
    .filter(
      (warning) =>
        warning.field === fieldListPath && !warning.definition,
    )
    .forEach((warning) => {
      const warningKey = `${warning.field}-${warning.message}`;
      if (!uniqueWarnings.has(warningKey)) {
        uniqueWarnings.set(warningKey, warning);
      }
    });

  return Array.from(uniqueWarnings.values());
}

/**
 * Returns validation messages for a specific child field within the FieldList.
 *
 * Matches warnings using the child's schema `definition`, which provides a
 * stable identifier for the field regardless of row index.
 *
 * This allows FieldList to correctly map validation messages to each child
 * widget, even when row-aware paths are not available in the warning data.
 *
 * Results are deduplicated to prevent duplicate messages from rendering.
 */

export function getFieldListChildErrors({
  rawErrors,
  childDefinition,
}: {
  rawErrors?: FormattedFormValidationWarning[];
  childDefinition: string;
}): string[] {
  if (!rawErrors?.length) {
    return [];
  }

  return Array.from(
    new Set(
      rawErrors
        .filter((warning) => warning.definition === childDefinition)
        .map((warning) => warning.formatted ?? warning.message),
    ),
  );
}
