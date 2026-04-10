import { FormattedFormValidationWarning } from "src/types/applyForm/types";

/**
 * Re-aligns row-aware FieldList validation warnings after a row is deleted.
 *
 * Validation warnings are indexed by row (e.g. `$.field[1].child`), but when
 * a row is removed locally, the remaining rows shift indices. This helper:
 *
 * - removes warnings for the deleted row
 * - shifts warnings for subsequent rows down by one index
 * - leaves earlier rows unchanged
 *
 * This keeps the UI in sync with the current row state until the next
 * validation pass from the backend.
 */
export const rebaseFieldListWarningsAfterDelete = ({
  rawErrors,
  fieldListPath,
  deletedEntryIndex,
}: {
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
  deletedEntryIndex: number;
}): FormattedFormValidationWarning[] | undefined => {
  if (!rawErrors?.length) {
    return rawErrors;
  }

  return rawErrors.flatMap((warning) => {
    const rowAwareFieldMatch = warning.field.match(
      new RegExp(
        `^\\$\\.${fieldListPath.replace(/^\$\./, "")}\\[(\\d+)\\]\\.(.+)$`,
      ),
    );

    if (!rowAwareFieldMatch) {
      return [warning];
    }

    const [, rowIndexText, storageKey] = rowAwareFieldMatch;
    const rowIndex = Number(rowIndexText);

    if (Number.isNaN(rowIndex)) {
      return [warning];
    }

    if (rowIndex === deletedEntryIndex) {
      return [];
    }

    if (rowIndex < deletedEntryIndex) {
      return [warning];
    }

    const nextRowIndex = rowIndex - 1;
    const nextField = `${fieldListPath}[${nextRowIndex}].${storageKey}`;

    const nextHtmlField = warning.htmlField
      ? warning.htmlField.replace(/\[(\d+)\]--/, `[${nextRowIndex}]--`)
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
