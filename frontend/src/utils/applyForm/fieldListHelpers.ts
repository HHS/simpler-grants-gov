import { FormattedFormValidationWarning } from "src/types/applyForm/types";

/**
 * Returns validation warnings that apply to the FieldList as a whole.
 *
 * These include array-level validation issues, such as minItems and maxItems,
 * that are associated with the FieldList field itself.
 *
 * Child field warnings are excluded by filtering out warnings with a
 * `definition`, since those represent nested field errors.
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
 * Returns validation messages for a child field within a specific FieldList entry.
 *
 * FieldList children can be flat fields:
 *
 *   $.contact_people[0].first_name
 *
 * or nested fields:
 *
 *   $.additional_sites[0].address.street1
 *
 * `storagePath` is used to build the row-aware validation path for both cases.
 *
 * If a warning does not include row-aware path information, this helper falls
 * back to matching by the child schema `definition` for the first entry only.
 *
 * Results are deduplicated to prevent duplicate messages from rendering.
 */
export function getFieldListChildErrors({
  rawErrors,
  fieldListPath,
  entryIndex,
  storagePath,
  childDefinition,
}: {
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
  entryIndex: number;
  storagePath: string[];
  childDefinition: string;
}): string[] {
  if (!rawErrors?.length) {
    return [];
  }

  const childFieldPath = storagePath.join(".");
  const rowAwareFieldPath = `${fieldListPath}[${entryIndex}].${childFieldPath}`;

  return Array.from(
    new Set(
      rawErrors
        .filter((warning) => {
          if (warning.field === rowAwareFieldPath) {
            return true;
          }

          const hasIndexedFieldPath = /\[\d+\]/.test(warning.field);

          if (hasIndexedFieldPath) {
            return false;
          }

          return entryIndex === 0 && warning.definition === childDefinition;
        })
        .map((warning) => warning.formatted ?? warning.message),
    ),
  );
}
