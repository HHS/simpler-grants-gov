import { FormattedFormValidationWarning } from "src/types/applyForm/types";

/**
 * Re-aligns row-aware FieldList validation warnings after an entry is deleted.
 *
 * Validation warnings are indexed by entry (for example
 * `$.contact_people_test[1].first_name`). When an entry is removed locally,
 * the remaining entries shift indices. This helper:
 *
 * - removes warnings for the deleted entry
 * - shifts warnings for subsequent entries down by one index
 * - leaves earlier entries unchanged
 *
 * This keeps the UI aligned with the current entry state until the next
 * backend validation pass.
 */
export const rebaseFieldListWarningsAfterDelete = ({
  rawErrors,
  fieldListPath,
  deletedEntryIndex,
}: {
  rawErrors?: FormattedFormValidationWarning[] | null;
  fieldListPath: string;
  deletedEntryIndex: number;
}): FormattedFormValidationWarning[] | null => {
  if (!rawErrors?.length) {
    return rawErrors ?? null;
  }

  const escapedFieldListPath = fieldListPath
    .replace(/^\$\./, "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return rawErrors.flatMap((warning) => {
    const entryAwareFieldMatch = warning.field.match(
      new RegExp(`^\\$\\.${escapedFieldListPath}\\[(\\d+)\\]\\.(.+)$`),
    );

    if (!entryAwareFieldMatch) {
      return [warning];
    }

    const [, entryIndexText, storageKey] = entryAwareFieldMatch;
    const entryIndex = Number(entryIndexText);

    if (Number.isNaN(entryIndex)) {
      return [warning];
    }

    if (entryIndex === deletedEntryIndex) {
      return [];
    }

    if (entryIndex < deletedEntryIndex) {
      return [warning];
    }

    const nextEntryIndex = entryIndex - 1;
    const nextField = `${fieldListPath}[${nextEntryIndex}].${storageKey}`;

    const nextHtmlField = warning.htmlField
      ? warning.htmlField.replace(/\[(\d+)\]--/, `[${nextEntryIndex}]--`)
      : warning.htmlField;

    return [
      {
        ...warning,
        field: nextField,
        htmlField: nextHtmlField,
      },
    ];
  });
};
