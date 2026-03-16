import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import {
  BroadlyDefinedWidgetValue,
  FieldListGroupItem,
  FieldListWidgetProps,
  GeneralRecord,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import { renderWidget } from "./WidgetRenderers";

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
 * If no value exists yet, or if the current value contains fewer rows than
 * `defaultSize`, this helper pads the result with empty row objects so the
 * widget always renders the expected minimum number of rows.
 */
const normalizeFieldListRows = ({
  value,
  defaultSize,
}: {
  value: GeneralRecord[] | undefined;
  defaultSize: number;
}): GeneralRecord[] => {
  const startingRows = Array.isArray(value)
    ? value.filter((rowValue): rowValue is GeneralRecord => {
        return typeof rowValue === "object" && rowValue !== null;
      })
    : [];

  if (startingRows.length >= defaultSize) {
    return startingRows;
  }

  const missingRowCount = defaultSize - startingRows.length;
  const paddedRows = Array.from({ length: missingRowCount }, () => ({}));

  return [...startingRows, ...paddedRows];
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
  rowIndex,
}: {
  baseId: string;
  rowIndex: number;
}): string => {
  return baseId.replace(FIELD_LIST_INDEX_TOKEN, String(rowIndex));
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
 * Returns a new row array with the row at `rowIndex` removed.
 */
const removeFieldListRow = ({
  rows,
  rowIndex,
}: {
  rows: GeneralRecord[];
  rowIndex: number;
}): GeneralRecord[] => {
  return rows.filter((_, currentRowIndex) => currentRowIndex !== rowIndex);
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

function FieldListWidget(widgetProps: FieldListWidgetProps) {
  const {
    id,
    label,
    description,
    defaultSize,
    groupDefinition,
    value,
    onChange,
    disabled,
    readOnly,
    isFormLocked,
    formContext,
  } = widgetProps;
  const t = useTranslations("Application.applyForm.fieldListWidget");

  /**
   * FieldList manages entry add/remove behavior locally so the UI updates
   * immediately during editing.
   *
   * The entries are rehydrated from the incoming `value` prop so the widget
   * stays aligned with saved form data after save / reload.
   */
  const [rows, setRows] = useState<GeneralRecord[]>(
    normalizeFieldListRows({
      value,
      defaultSize,
    }),
  );

  /**
   * Updates the local row state and optionally forwards the new value through
   * the widget-style `onChange` prop for compatibility with the broader form
   * rendering system.
   */
  const handleRowsChange = (nextRows: GeneralRecord[]): void => {
    setRows(nextRows);
    onChange?.(nextRows);
  };

  const handleAddRow = (): void => {
    handleRowsChange(
      addFieldListRow({
        rows,
      }),
    );
  };

  const handleDeleteRow = (rowIndex: number): void => {
    handleRowsChange(
      removeFieldListRow({
        rows,
        rowIndex,
      }),
    );
  };

  const isInteractionDisabled = Boolean(disabled || readOnly || isFormLocked);

  /**
   * Re-sync local rows whenever the saved value changes.
   *
   * This is what allows FieldList entries to hydrate correctly after save,
   * reload, or navigation back into the form.
   */
  useEffect(() => {
    setRows(
      normalizeFieldListRows({
        value,
        defaultSize,
      }),
    );
  }, [value, defaultSize]);

  return (
    <div id={id} className="field-list-widget">
      {label ? <h3>{label}</h3> : null}
      {description ? <p>{description}</p> : null}

      {rows.map((rowValue, rowIndex) => {
        return (
          <div
            key={`${id}--row-${rowIndex}`}
            className="field-list-widget__row"
          >
            <div className="field-list-widget__controls">
              <strong>
                {t("entry")} {rowIndex + 1}
              </strong>
              <Button
                type="button"
                onClick={() => handleDeleteRow(rowIndex)}
                disabled={isInteractionDisabled}
              >
                {t("delete")}
              </Button>
            </div>

            {groupDefinition.map((groupItem: FieldListGroupItem) => {
              const generatedId = replaceFieldListIndexPlaceholder({
                baseId: groupItem.baseId,
                rowIndex,
              });

              const storageKey = getFieldListStorageKey({
                baseId: groupItem.baseId,
              });

              const currentValue = toBroadlyDefinedWidgetValue(
                rowValue[storageKey],
              );

              /**
               * Updates a single field within the current row while preserving
               * the rest of the row and all sibling rows.
               */
              const handleChildChange = (nextValue: unknown): void => {
                const nextRows = [...rows];

                const updatedRow = {
                  ...nextRows[rowIndex],
                  [storageKey]: nextValue,
                };

                nextRows[rowIndex] = updatedRow;

                handleRowsChange(nextRows);
              };

              /**
               * Build a standard widget prop object for the child field so it
               * can be rendered through the existing WidgetRenderers pipeline.
               */
              const childWidgetProps: UswdsWidgetProps = {
                ...groupItem.generalProps,
                schema: groupItem.generalProps.schema,
                id: generatedId,
                key: generatedId,
                value: currentValue,
                onChange: handleChildChange,
                isFormLocked,
                formContext,
              };

              return renderWidget({
                type: groupItem.widget,
                props: childWidgetProps,
              });
            })}
          </div>
        );
      })}

      <div className="field-list-widget__controls">
        <Button
          type="button"
          onClick={handleAddRow}
          disabled={isInteractionDisabled}
        >
          + {t("add")}
        </Button>
      </div>
    </div>
  );
}

export default FieldListWidget;
