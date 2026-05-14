import { RJSFSchema } from "@rjsf/utils/lib/types";
import {
  BroadlyDefinedWidgetValue,
  FieldListGroupItem,
  FieldListWidgetProps,
  FormattedFormValidationWarning,
  GeneralRecord,
  UswdsWidgetProps,
} from "src/types/applyForm/types";
import {
  getFieldListChildErrors,
  getFieldListGroupErrors,
} from "src/utils/applyForm/fieldListHelpers";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { isFieldRequired } from "src/components/applyForm/utils";
import { renderWidget } from "./WidgetRenderers";

/**
 * Params for updating a specific field within a FieldList row.
 *
 * `nextValue` is typed as `unknown` because widget `onChange` handlers
 * emit `unknown` by contract. This value is normalized to
 * `BroadlyDefinedWidgetValue` inside `handleFieldChange`.
 */
type FieldListChangeParams = {
  entryIndex: number;
  storageKey: string;
  nextValue: unknown;
};

const FIELD_LIST_INDEX_TOKEN = "~~index~~";

/**
 * Normalizes the incoming FieldList value into a predictable row array.
 *
 * FieldList values are stored as an array of row objects:
 *
 * [
 *   { first_name: "Jon", last_name: "Doe" },
 *   { first_name: "Jane" }
 * ]
 *
 */
const normalizeFieldListRows = ({
  value,
  minItems,
}: {
  value: GeneralRecord[] | undefined;
  minItems?: number;
}): GeneralRecord[] => {
  const startingRows = Array.isArray(value)
    ? value.filter((entryValue): entryValue is GeneralRecord => {
        return typeof entryValue === "object" && entryValue !== null;
      })
    : [];

  const minimumRowCount = minItems ?? 0;

  if (startingRows.length >= minimumRowCount) {
    return startingRows;
  }

  const missingRowCount = minimumRowCount - startingRows.length;

  return [
    ...startingRows,
    ...Array.from({ length: missingRowCount }, () => ({})),
  ];
};

/**
 * Replaces the FieldList row index placeholder with the actual row index.
 *
 * Example:
 *   contact_people_test[~~index~~]--first_name
 *
 * becomes:
 *   contact_people_test[0]--first_name
 */
const replaceFieldListIndexPlaceholder = ({
  baseId,
  entryIndex,
}: {
  baseId: string;
  entryIndex: number;
}): string => {
  return baseId.replace(FIELD_LIST_INDEX_TOKEN, String(entryIndex));
};

/**
 * Extracts the row-local storage key from a generated FieldList base id.
 *
 * Example:
 *   contact_people_test[~~index~~]--first_name
 *
 * yields:
 *   first_name
 *
 * This key is used to read and write values within an individual row object.
 */
const getFieldListStorageKey = ({ baseId }: { baseId: string }): string => {
  const baseIdParts = baseId.split("--");
  return baseIdParts[baseIdParts.length - 1];
};

/**
 * Returns a new row array with one additional empty row appended.
 */
const addFieldListRow = ({
  rows,
}: {
  rows: GeneralRecord[];
}): GeneralRecord[] => {
  return [...rows, {}];
};

/**
 * Returns a new row array with the row at `entryIndex` removed.
 */
const removeFieldListRow = ({
  rows,
  entryIndex,
}: {
  rows: GeneralRecord[];
  entryIndex: number;
}): GeneralRecord[] => {
  return rows.filter(
    (_, currentEntryIndex) => currentEntryIndex !== entryIndex,
  );
};

/**
 * Narrows row values into the value shapes accepted by the widget renderer.
 *
 * Child widgets rendered inside FieldList still expect standard widget values
 * such as:
 * - string
 * - number
 * - boolean
 * - string[]
 * - object
 *
 * Since row object access returns `unknown`, this helper safely converts the
 * value into a `BroadlyDefinedWidgetValue` when possible.
 */
const toBroadlyDefinedWidgetValue = (
  value: unknown,
): BroadlyDefinedWidgetValue | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as GeneralRecord;
  }

  return undefined;
};

function FieldListEntry({
  id,
  entryIndex,
  entryValue,
  canDeleteEntry,
  handleDeleteRow,
  handleFieldChange,
  rawErrors,
  fieldListPath,
  groupDefinition,
  requiredFields,
}: {
  id: string;
  entryIndex: number;
  entryValue: GeneralRecord;
  canDeleteEntry: boolean;
  handleDeleteRow: (entryIndex: number) => void;
  handleFieldChange: (params: FieldListChangeParams) => void;
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
  groupDefinition: FieldListGroupItem[];
  requiredFields?: string[];
}) {
  const t = useTranslations("Application.applyForm.fieldListWidget");

  return (
    <div
      key={`${id}--row-${entryIndex}`}
      className="field-list-widget__row border radius-md border-base-lighter padding-2 margin-2"
    >
      <div className="field-list-widget__controls display-flex flex-align-center flex-justify margin-bottom-2">
        <strong>
          {t("entry")} {entryIndex + 1}
        </strong>
        <Button
          type="button"
          onClick={() => handleDeleteRow(entryIndex)}
          disabled={!canDeleteEntry}
        >
          {t("delete")}
        </Button>
      </div>

      {groupDefinition.map((groupItem: FieldListGroupItem) => {
        const isRequired = isFieldRequired(
          groupItem.definition,
          requiredFields ?? [],
        );

        const generatedId = replaceFieldListIndexPlaceholder({
          baseId: groupItem.baseId,
          entryIndex,
        });

        const storageKey = getFieldListStorageKey({
          baseId: groupItem.baseId,
        });

        const childErrors = getFieldListChildErrors({
          rawErrors,
          fieldListPath,
          entryIndex,
          storageKey,
          childDefinition: groupItem.definition,
        });

        const currentValue = toBroadlyDefinedWidgetValue(
          entryValue[storageKey],
        );

        /**
         * Build a standard widget prop object for the child field so it
         * can be rendered through the existing WidgetRenderers pipeline.
         */
        const childWidgetProps: UswdsWidgetProps = {
          ...groupItem.generalProps,
          schema: groupItem.generalProps.schema as RJSFSchema,
          id: generatedId,
          name: generatedId,
          key: generatedId,
          value: currentValue,
          rawErrors: childErrors,
          required: isRequired,
          onChange: (nextValue) =>
            handleFieldChange({
              entryIndex,
              storageKey,
              nextValue,
            }),
        };
        return renderWidget({
          type: groupItem.widget,
          props: childWidgetProps,
        });
      })}
    </div>
  );
}

function FieldListWidget(widgetProps: FieldListWidgetProps) {
  const {
    id,
    label,
    description,
    name,
    minItems,
    maxItems,
    groupDefinition,
    value,
    onChange,
    disabled,
    readOnly,
    isFormLocked,
    rawErrors,
  } = widgetProps;
  const t = useTranslations("Application.applyForm.fieldListWidget");
  const fieldListPath = `$.${name}`;
  const groupErrors = getFieldListGroupErrors({
    rawErrors,
    fieldListPath,
  });

  /**
   * FieldList manages entry add/remove behavior locally so the UI updates
   * immediately during editing.
   *
   * The entries are rehydrated from the incoming `value` prop so the widget
   * stays aligned with saved form data after save / reload.
   */
  const initialFieldListRows = useMemo(
    () =>
      normalizeFieldListRows({
        value,
        minItems,
      }),
    [value, minItems],
  );

  const [rows, setRows] = useState<GeneralRecord[]>(initialFieldListRows);

  const onFieldListEntryDelete =
    widgetProps.formContext?.widgetSupport?.onFieldListEntryDelete;

  const markFormDirty = widgetProps.formContext?.widgetSupport?.markFormDirty;

  const isInteractionDisabled = Boolean(disabled || readOnly || isFormLocked);
  const minimumEntryCount = minItems ?? 0;
  const maximumEntryCount = maxItems;

  const isAtMinimumEntryCount = rows.length <= minimumEntryCount;
  const isAtMaximumEntryCount =
    maximumEntryCount !== undefined && rows.length >= maximumEntryCount;

  const canAddEntry = !isInteractionDisabled && !isAtMaximumEntryCount;
  const canDeleteEntry = !isInteractionDisabled && !isAtMinimumEntryCount;

  /**
   * Applies updates to FieldList rows.
   *
   * This is the central update path for:
   * - child field edits
   * - entry additions
   * - entry deletions
   *
   * Also marks the parent form dirty so existing unsaved-change
   * protections apply to FieldList interactions.
   */
  const handleRowsChange = useCallback(
    (getNextRows: (previousRows: GeneralRecord[]) => GeneralRecord[]): void => {
      const nextRows = getNextRows(rows);

      setRows(nextRows);
      onChange?.(nextRows);
      markFormDirty?.();
    },
    [markFormDirty, onChange, rows],
  );

  const handleAddRow = useCallback((): void => {
    if (maximumEntryCount !== undefined && rows.length >= maximumEntryCount) {
      return;
    }

    handleRowsChange((previousRows) =>
      addFieldListRow({
        rows: previousRows,
      }),
    );
  }, [handleRowsChange, maximumEntryCount, rows.length]);

  const handleDeleteRow = useCallback(
    (entryIndex: number): void => {
      if (rows.length <= minimumEntryCount) {
        return;
      }

      onFieldListEntryDelete?.(fieldListPath, entryIndex);

      handleRowsChange((previousRows) =>
        removeFieldListRow({
          rows: previousRows,
          entryIndex,
        }),
      );
    },
    [
      fieldListPath,
      handleRowsChange,
      minimumEntryCount,
      onFieldListEntryDelete,
      rows.length,
    ],
  );

  /**
   * Handles updates to a single field within a specific row.
   *
   * Receives raw `unknown` values from child widgets and normalizes them
   * before updating the row state. Ensures updates are scoped to the correct
   * row and field, and preserves immutability of the rows array.
   */
  const handleFieldChange = useCallback(
    ({ entryIndex, storageKey, nextValue }: FieldListChangeParams): void => {
      const normalizedNextValue = toBroadlyDefinedWidgetValue(nextValue);

      handleRowsChange((previousRows) =>
        previousRows.map((previousRow, currentEntryIndex) => {
          if (currentEntryIndex !== entryIndex) {
            return previousRow;
          }

          return {
            ...previousRow,
            [storageKey]: normalizedNextValue,
          };
        }),
      );
    },
    [handleRowsChange],
  );

  return (
    <div id={id} className="field-list-widget">
      {label ? <h3>{label}</h3> : null}
      {description ? <p>{description}</p> : null}

      {groupErrors.length > 0 ? (
        <ul className="usa-error-message margin-top-1" aria-live="polite">
          {groupErrors.map((error) => (
            <li key={`${error.field}-${error.message}`}>
              {error.formatted ?? error.message}
            </li>
          ))}
        </ul>
      ) : null}

      {rows.map((entryValue, entryIndex) => {
        return (
          <FieldListEntry
            key={`${id}-${entryIndex}`}
            id={id}
            entryIndex={entryIndex}
            entryValue={entryValue}
            canDeleteEntry={canDeleteEntry}
            handleDeleteRow={handleDeleteRow}
            handleFieldChange={handleFieldChange}
            groupDefinition={groupDefinition}
            rawErrors={rawErrors}
            fieldListPath={fieldListPath}
            requiredFields={widgetProps.requiredFields}
          />
        );
      })}
      {isAtMaximumEntryCount ? (
        <p className="usa-hint margin-top-1">
          Maximum of {maximumEntryCount} entries reached.
        </p>
      ) : null}
      <div className="field-list-widget__controls display-flex flex-align-center flex-justify-between margin-bottom-2">
        <Button type="button" onClick={handleAddRow} disabled={!canAddEntry}>
          + {t("add")}
        </Button>
      </div>
    </div>
  );
}

export default FieldListWidget;
