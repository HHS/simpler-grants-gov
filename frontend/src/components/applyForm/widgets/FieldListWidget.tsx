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
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { isFieldRequired } from "src/components/applyForm/utils";
import { renderWidget } from "./WidgetRenderers";

/**
 * Params for updating a specific field within a FieldList entry.
 *
 * `nextValue` is typed as `unknown` because widget `onChange` handlers
 * emit `unknown` by contract. This value is normalized to
 * `BroadlyDefinedWidgetValue` inside `handleFieldChange`.
 */
type FieldListChangeParams = {
  entryId: string;
  storageKey: string;
  nextValue: unknown;
};

type FieldListEntry = {
  entryId: string;
  value: GeneralRecord;
};

const FIELD_LIST_INDEX_TOKEN = "~~index~~";

/**
 * Builds the initial entries rendered by FieldList.
 *
 * Saved form data is stored as `GeneralRecord[]`, but the widget needs stable
 * client-side entry ids so React can preserve each entry's local state when
 * entries are added or removed. The entry ids are only used for rendering and
 * are stripped before values are sent back to the parent form.
 *
 * If the schema defines `minItems`, blank entries are appended so the UI shows
 * the required minimum number of entries.
 */
const normalizeFieldListEntries = ({
  value,
  minItems,
}: {
  value: GeneralRecord[] | undefined;
  minItems?: number;
}): FieldListEntry[] => {
  const startingEntries = Array.isArray(value)
    ? value
        .filter((entryValue): entryValue is GeneralRecord => {
          return typeof entryValue === "object" && entryValue !== null;
        })
        .map((entryValue) => ({
          entryId: createFieldListEntryValueId(),
          value: entryValue,
        }))
    : [];

  const minimumEntryCount = minItems ?? 0;

  if (startingEntries.length >= minimumEntryCount) {
    return startingEntries;
  }

  const missingEntryCount = minimumEntryCount - startingEntries.length;

  return [
    ...startingEntries,
    ...Array.from({ length: missingEntryCount }, () => ({
      entryId: createFieldListEntryValueId(),
      value: {},
    })),
  ];
};

let fieldListEntryValueIdCounter = 0;

const createFieldListEntryValueId = (): string => {
  fieldListEntryValueIdCounter += 1;

  return `${Date.now()}-${fieldListEntryValueIdCounter}`;
};

/**
 * Replaces the FieldList entry index placeholder with the actual entry index.
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
 * Extracts the field key used to store a child value within an entry object.
 *
 * Example:
 *   contact_people_test[~~index~~]--first_name
 *
 * yields:
 *   first_name
 */
const getFieldListStorageKey = ({ baseId }: { baseId: string }): string => {
  const baseIdParts = baseId.split("--");
  return baseIdParts[baseIdParts.length - 1];
};

/**
 * Returns a new entry array with one additional empty entry appended.
 */
const addFieldListEntry = ({
  entries,
}: {
  entries: FieldListEntry[];
}): FieldListEntry[] => {
  return [
    ...entries,
    {
      entryId: createFieldListEntryValueId(),
      value: {},
    },
  ];
};

/**
 * Narrows entry values into the value shapes accepted by the widget renderer.
 *
 * Child widgets rendered inside FieldList still expect standard widget values
 * such as:
 * - string
 * - number
 * - boolean
 * - string[]
 * - object
 *
 * Since entry object access returns `unknown`, this helper safely converts the
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

/**
 * Removes FieldList-only metadata before sending values back to the parent form.
 *
 * The parent form and save pipeline expect FieldList data as `GeneralRecord[]`.
 * `entryId` is only used locally by the widget for stable React rendering.
 */
const getFieldListValues = (entries: FieldListEntry[]): GeneralRecord[] => {
  return entries.map((entry) => entry.value);
};

function FieldListEntry({
  entryId,
  entryIndex,
  entryValue,
  canDeleteEntry,
  handleDeleteEntry,
  handleFieldChange,
  rawErrors,
  fieldListPath,
  groupDefinition,
  requiredFields,
}: {
  entryId: string;
  entryIndex: number;
  entryValue: GeneralRecord;
  canDeleteEntry: boolean;
  handleDeleteEntry: (entryId: string) => void;
  handleFieldChange: (params: FieldListChangeParams) => void;
  rawErrors?: FormattedFormValidationWarning[];
  fieldListPath: string;
  groupDefinition: FieldListGroupItem[];
  requiredFields?: string[];
}) {
  const t = useTranslations("Application.applyForm.fieldListWidget");

  return (
    <div className="field-list-widget__entry border radius-md border-base-lighter padding-2 margin-2">
      <div className="field-list-widget__controls display-flex flex-align-center flex-justify margin-bottom-2">
        <strong>
          {t("entry")} {entryIndex + 1}
        </strong>
        <Button
          type="button"
          onClick={() => handleDeleteEntry(entryId)}
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
         * FieldList children need to be reactive so local entry state stays in sync
         * while users type. Standard form fields can remain non-reactive, but FieldList
         * must update local state before add/delete operations so unsaved entry values
         * are not lost when indexes shift.
         */
        const childWidgetProps: UswdsWidgetProps = {
          ...groupItem.generalProps,
          schema: groupItem.generalProps.schema as RJSFSchema,
          id: generatedId,
          name: generatedId,
          key: `${entryId}-${storageKey}`,
          value: currentValue,
          rawErrors: childErrors,
          required: isRequired,
          updateOnInput: true,
          onChange: (nextValue) => {
            handleFieldChange({
              entryId,
              storageKey,
              nextValue,
            });
          },
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
  const initialFieldListEntries = useMemo(
    () =>
      normalizeFieldListEntries({
        value,
        minItems,
      }),
    [value, minItems],
  );

  const [entries, setEntries] = useState<FieldListEntry[]>(
    initialFieldListEntries,
  );
  const entriesRef = useRef<FieldListEntry[]>(initialFieldListEntries);

  const onFieldListEntryDelete =
    widgetProps.formContext?.widgetSupport?.onFieldListEntryDelete;

  const markFormDirty = widgetProps.formContext?.widgetSupport?.markFormDirty;

  const isInteractionDisabled = Boolean(disabled || readOnly || isFormLocked);
  const minimumEntryCount = minItems ?? 0;
  const maximumEntryCount = maxItems;

  const isAtMinimumEntryCount = entries.length <= minimumEntryCount;
  const isAtMaximumEntryCount =
    maximumEntryCount !== undefined && entries.length >= maximumEntryCount;

  const canAddEntry = !isInteractionDisabled && !isAtMaximumEntryCount;
  const canDeleteEntry = !isInteractionDisabled && !isAtMinimumEntryCount;

  /**
   * Applies updates to FieldList entries.
   *
   * This is the central update path for:
   * - child field edits
   * - entry additions
   * - entry deletions
   *
   * Also marks the parent form dirty so existing unsaved-change
   * protections apply to FieldList interactions.
   */
  const handleEntriesChange = useCallback(
    (
      getNextEntries: (previousEntries: FieldListEntry[]) => FieldListEntry[],
    ): void => {
      const nextEntries = getNextEntries(entriesRef.current);
      entriesRef.current = nextEntries;
      setEntries(nextEntries);
      onChange?.(getFieldListValues(nextEntries));
      markFormDirty?.();
    },
    [markFormDirty, onChange],
  );

  const handleAddEntry = useCallback((): void => {
    const currentEntries = entriesRef.current;

    if (
      maximumEntryCount !== undefined &&
      currentEntries.length >= maximumEntryCount
    ) {
      return;
    }

    handleEntriesChange((previousEntries) =>
      addFieldListEntry({
        entries: previousEntries,
      }),
    );
  }, [handleEntriesChange, maximumEntryCount]);

  const handleDeleteEntry = useCallback(
    (entryId: string): void => {
      const currentEntries = entriesRef.current;

      if (currentEntries.length <= minimumEntryCount) {
        return;
      }

      const entryIndex = currentEntries.findIndex(
        (entry) => entry.entryId === entryId,
      );

      if (entryIndex === -1) {
        return;
      }

      onFieldListEntryDelete?.(fieldListPath, entryIndex);

      handleEntriesChange((previousEntries) =>
        previousEntries.filter((entry) => entry.entryId !== entryId),
      );
    },
    [
      fieldListPath,
      handleEntriesChange,
      minimumEntryCount,
      onFieldListEntryDelete,
    ],
  );

  /**
   * Handles updates to a single field within a specific row.
   *
   * Receives raw `unknown` values from child widgets and normalizes them
   * before updating the row state. Ensures updates are scoped to the correct
   * row and field, and preserves immutability of the entries array.
   */
  const handleFieldChange = useCallback(
    ({ entryId, storageKey, nextValue }: FieldListChangeParams): void => {
      const normalizedNextValue = toBroadlyDefinedWidgetValue(nextValue);

      handleEntriesChange((previousEntries) =>
        previousEntries.map((previousEntry) => {
          if (previousEntry.entryId !== entryId) {
            return previousEntry;
          }

          return {
            ...previousEntry,
            value: {
              ...previousEntry.value,
              [storageKey]: normalizedNextValue,
            },
          };
        }),
      );
    },
    [handleEntriesChange],
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

      {entries.map((entry, entryIndex) => {
        return (
          <FieldListEntry
            key={entry.entryId}
            entryId={entry.entryId}
            entryValue={entry.value}
            entryIndex={entryIndex}
            canDeleteEntry={canDeleteEntry}
            handleDeleteEntry={handleDeleteEntry}
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
        <Button type="button" onClick={handleAddEntry} disabled={!canAddEntry}>
          + {t("add")}
        </Button>
      </div>
    </div>
  );
}

export default FieldListWidget;
