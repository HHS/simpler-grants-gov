"use client";

import {
  and,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  schemaSubPathMatches,
  type ArrayLayoutProps,
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from "@jsonforms/core";
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react";
import type { FieldListWidgetProps } from "src/types/applyForm/types";
import {
  dataPathToHtmlName,
  dataPathToWarningPath,
} from "src/utils/applyForm/dataPaths";
import { getFieldListGroupErrors } from "src/utils/applyForm/fieldListHelpers";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { useAdapterContext } from "src/components/apply-form/jsonforms/adapterContext";
import {
  Heading,
  HeadingLevel,
  useHeadingLevel,
} from "src/components/apply-form/jsonforms/headingLevel";
import { USWDSIcon } from "src/components/core/USWDSIcon";

/*
  Render a list of objects or plain values at any path (the form's root, inside an object, or inside
  another list's entry) with JSON Forms instead of the SGG field-list widget. Store the
  entries in JSON Forms' data and dispatch each entry at its own data path (`people.0`), so
  rules, labeled groups and nested lists inside an entry work as they do at the root. Dispatch
  a plain value's entry as a control on the entry itself (`#`), which the SGG adapter renders
  as one field at its data path (`places.0`).
*/

/** Rank above the SGG adapter (10), which would otherwise show the list with the field-list widget. */
const FIELD_LIST_RANK = 11;

/**
 * Return the layout for one entry: the control's `options.detail`, or a control for each of
 * the item's properties, read-only when the list is.
 */
const entryLayout = (
  uischema: ControlElement,
  items: JsonSchema,
  readonly?: boolean,
): UISchemaElement => {
  const detail = (uischema.options as { detail?: unknown } | undefined)?.detail;
  if (detail && typeof detail === "object" && "type" in detail) {
    return detail as UISchemaElement;
  }
  const layout: UISchemaElement & { elements: ControlElement[] } = {
    type: "VerticalLayout",
    elements: Object.keys(items.properties ?? {}).map((name) => ({
      type: "Control",
      scope: `#/properties/${name}`,
      ...(readonly ? { options: { readonly } } : {}),
    })),
  };
  return layout;
};

/**
 * Match a list of plain values (strings, numbers, booleans). Leave a list of enum values or
 * attachments to the SGG adapter, which renders it with a multi-select or attachment widget.
 */
const isPrimitiveListControl = and(
  isPrimitiveArrayControl,
  schemaSubPathMatches(
    "items",
    (items) => !items.enum && items.format !== "uuid",
  ),
);

/** Give each entry a stable id, so deleting an entry doesn't remount the entries after it. */
const useEntryIds = (initialCount: number) => {
  const next = useRef(initialCount);
  const [ids, setIds] = useState(() =>
    Array.from({ length: initialCount }, (_, index) => `entry-${index}`),
  );
  return {
    ids,
    add: () => setIds((current) => [...current, `entry-${next.current++}`]),
    remove: (index: number) =>
      setIds((current) => current.filter((_, i) => i !== index)),
  };
};

/**
 * Render the list's heading, warnings, entries, and add and delete buttons. Use the same
 * markup, classes and strings as the SGG field-list widget, so the two look alike.
 */
const FieldListControl = (props: ArrayLayoutProps) => {
  const {
    uischema,
    schema,
    arraySchema,
    path,
    data,
    label,
    enabled,
    visible,
    renderers,
    cells,
  } = props;
  const t = useTranslations("Application.applyForm.fieldListWidget");
  const context = useAdapterContext();
  const level = useHeadingLevel();
  const minItems = arraySchema.minItems ?? 0;
  const maxItems = arraySchema.maxItems;
  // Start with the saved entries, padded to minItems.
  const entries = useEntryIds(Math.max(data, minItems));
  if (!visible) return null;

  const options = (uischema.options ?? {}) as {
    description?: string;
    readonly?: boolean;
  };
  const title = arraySchema.title ?? label;
  const description = options.description ?? arraySchema.description;
  const listWarningPath = dataPathToWarningPath(path);
  const htmlId = dataPathToHtmlName(path);
  const headingId = (index: number) =>
    `${htmlId.replace(/\W/g, "-")}-entry-${index + 1}-heading`;
  const isPrimitive = schema.type !== "object" && !schema.properties;
  // A plain value's entry is one control on the entry itself, labeled with the item's title or the list's.
  const detail: UISchemaElement = isPrimitive
    ? {
        type: "Control",
        scope: "#",
        label: schema.title ?? title,
        ...(options.readonly ? { options: { readonly: true } } : {}),
      }
    : entryLayout(uischema, schema, options.readonly);
  const entryLevel = title ? level + 2 : level + 1;
  // Use the callbacks the form passes to its field-list widgets.
  const widgetSupport = (
    context.formContext as FieldListWidgetProps["formContext"]
  )?.widgetSupport;

  const locked = Boolean(
    !enabled || options.readonly || context.isFormLocked || context.print,
  );
  const count = entries.ids.length;
  const canAdd = !locked && (maxItems === undefined || count < maxItems);
  const canDelete = !locked && count > minItems;

  const add = () => {
    if (!canAdd) return;
    entries.add();
    props.addItem(path, isPrimitive ? undefined : {})();
    widgetSupport?.markFormDirty?.();
  };
  const remove = (index: number) => {
    if (!canDelete) return;
    // Shift the warnings on later entries, as the field-list widget does.
    widgetSupport?.onFieldListEntryDelete?.(listWarningPath, index);
    entries.remove(index);
    props.removeItems?.(path, [index])();
    widgetSupport?.markFormDirty?.();
  };

  const groupErrors = getFieldListGroupErrors({
    rawErrors: context.errors ?? undefined,
    fieldListPath: listWarningPath,
  });

  return (
    <div
      id={htmlId}
      aria-label={title || undefined}
      className="field-list-widget border border-base-lighter radius-md padding-2 margin-y-2"
    >
      {title ? (
        <Heading level={level + 1} className="font-sans-md">
          {title}
        </Heading>
      ) : null}
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

      {entries.ids.map((id, index) => (
        <div
          key={id}
          className="field-list-widget__entry padding-y-2 padding-bottom-3"
        >
          <Heading
            level={entryLevel}
            id={headingId(index)}
            className="font-sans-sm margin-bottom-2"
          >
            {title} {index + 1}
          </Heading>

          {/* Set the entry's heading level, and have its heading describe each field in the entry. */}
          <HeadingLevel level={entryLevel} fieldHeadingId={headingId(index)}>
            <JsonFormsDispatch
              uischema={detail}
              schema={schema}
              path={`${path}.${index}`}
              enabled={enabled && !locked}
              renderers={renderers}
              cells={cells}
            />
          </HeadingLevel>

          {context.print ? null : (
            <div className="field-list-widget__entry-controls margin-top-2 padding-top-2 display-flex flex-justify-end">
              <Button
                type="button"
                onClick={() => remove(index)}
                disabled={!canDelete}
                className="button--danger"
                outline
                aria-label={`${t("deleteEntry")} ${title} ${index + 1}`}
              >
                <USWDSIcon name="delete" />
                {t("deleteEntry")}
              </Button>
            </div>
          )}
        </div>
      ))}

      {context.print ? null : (
        <div className="field-list-widget__controls padding-top-2 display-flex flex-justify-end">
          <Button type="button" onClick={add} disabled={!canAdd} outline>
            <USWDSIcon name="add" />
            {t("addEntry")}
          </Button>
        </div>
      )}
    </div>
  );
};

/** Render a control on an array of objects or plain values, at any path, as a field list. */
export const fieldListControl: JsonFormsRendererRegistryEntry = {
  tester: rankWith(
    FIELD_LIST_RANK,
    or(isObjectArrayControl, isPrimitiveListControl),
  ),
  renderer: withJsonFormsArrayLayoutProps(FieldListControl),
};
