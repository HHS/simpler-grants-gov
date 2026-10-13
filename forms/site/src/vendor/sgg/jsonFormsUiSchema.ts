// TEMPORARY COPY of the pending frontend/src/utils/applyForm/jsonFormsUiSchema.ts, so the
// form library can render with the SGG form widgets before the JSON Forms renderer lands in
// the frontend. Only import paths are changed. Delete src/vendor/sgg with #12695.
import type {
  ControlElement,
  GroupLayout,
  Layout,
  UISchemaElement,
} from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import type {
  UiSchema,
  UiSchemaField,
  UiSchemaFieldList,
  UiSchemaNode,
  WidgetTypes,
} from "@sgg/frontend/types/applyForm/types";
import { getByPointer } from "@sgg/frontend/utils/formData/formDataUtils";

/*
  A form whose `form_renderer` is "jsonforms" arrives with a JSON Forms UI schema instead of
  the section/field tree the rest of the apply-form code reads. JSON Forms lays the form out
  and evaluates its rules, but every control it draws is still one of our widgets, reached
  through the same `getFieldConfig` -> `renderWidget` path as any other form.

  The functions here translate between the two shapes, so warnings, navigation, print and
  the UI schema validator all keep working off the tree they already understand.
*/

export type JsonFormsUiSchema = UISchemaElement;

type FieldNode = UiSchemaField | UiSchemaFieldList;
type Definition = `/properties/${string}`;

const isLayout = (element: UISchemaElement): element is Layout =>
  Array.isArray((element as Layout).elements);

const isControlElement = (
  element: UISchemaElement,
): element is ControlElement => element.type === "Control";

/** `#/properties/a/properties/b` -> `/properties/a/properties/b` */
const scopeToDefinition = (scope: string): Definition | undefined =>
  scope.startsWith("#/properties/")
    ? (scope.slice(1) as Definition)
    : undefined;

const schemaAt = (
  schema: RJSFSchema,
  definition: string,
): RJSFSchema | undefined => {
  try {
    const found = getByPointer(schema, definition);
    return found && typeof found === "object" ? found : undefined;
  } catch {
    return undefined;
  }
};

const isObjectSchema = (schema: RJSFSchema): boolean =>
  !!schema.properties && typeof schema.properties === "object";

const itemSchema = (schema: RJSFSchema): RJSFSchema | undefined =>
  schema.type === "array" &&
  schema.items &&
  typeof schema.items === "object" &&
  !Array.isArray(schema.items)
    ? schema.items
    : undefined;

/** Every leaf beneath an object, in declaration order, as definition pointers. */
const leafDefinitions = (schema: RJSFSchema, base: Definition): Definition[] =>
  isObjectSchema(schema)
    ? Object.entries(schema.properties as Record<string, RJSFSchema>).flatMap(
        ([name, child]) => leafDefinitions(child, `${base}/properties/${name}`),
      )
    : [base];

/** A top-level property, the only place a field list may sit. */
const ROOT_PROPERTY = /^\/properties\/([^/]+)$/;

/** A list control's layout for one entry, when the UI schema gives one. */
const entryLayout = (control: ControlElement): UISchemaElement | undefined => {
  const detail = (control.options as { detail?: unknown } | undefined)?.detail;
  return detail && typeof detail === "object" && "type" in detail
    ? (detail as UISchemaElement)
    : undefined;
};

type EntryField = UiSchemaFieldList["children"][number];

/**
 * A list entry's fields, in the order its `options.detail` lays them out.
 *
 * Scopes inside the detail are relative to one entry, so each control is rebased beneath
 * the list's `items` and then read like any other control. A list nested inside the entry
 * has no field-list equivalent and is left out; `unappliedListRules` and
 * `unadaptableScopes` report what this drops.
 */
const entryFields = (
  element: UISchemaElement,
  schema: RJSFSchema,
  itemsBase: Definition,
): EntryField[] => {
  if (isControlElement(element)) {
    if (!element.scope.startsWith("#/")) return [];
    const rebased = {
      ...element,
      scope: `#${itemsBase}${element.scope.slice(1)}`,
    };
    return controlToNodes(rebased, schema).filter(
      (node): node is EntryField => node.type !== "fieldList",
    );
  }
  return isLayout(element)
    ? element.elements.flatMap((child) => entryFields(child, schema, itemsBase))
    : [];
};

/**
 * The field nodes one JSON Forms control stands for.
 *
 * A control scoped to a scalar is one field. A control scoped to an object is each of the
 * object's leaves, which is how the SGG UI schema lists a composed question. A control
 * scoped to a top-level array of objects is a field list, whose fields follow the control's
 * `options.detail` when it has one and the item schema otherwise. Anything else returns no
 * nodes, and JSON Forms falls back to its own renderer for it.
 */
export const controlToNodes = (
  control: ControlElement,
  schema: RJSFSchema,
): FieldNode[] => {
  const definition = scopeToDefinition(control.scope);
  if (!definition) return [];
  const fieldSchema = schemaAt(schema, definition);
  if (!fieldSchema) return [];

  const options = (control.options ?? {}) as {
    readonly?: boolean;
    widget?: WidgetTypes;
  };
  const type = options.readonly ? "null" : "field";

  const items = itemSchema(fieldSchema);
  if (items && isObjectSchema(items)) {
    const rootProperty = ROOT_PROPERTY.exec(definition);
    if (!rootProperty) return [];
    const name = rootProperty[1];
    const itemsBase: Definition = `${definition}/items`;
    const layout = entryLayout(control);
    return [
      {
        type: "fieldList",
        name,
        label:
          (typeof control.label === "string" ? control.label : undefined) ??
          fieldSchema.title ??
          name,
        description: fieldSchema.description,
        children: layout
          ? entryFields(layout, schema, itemsBase)
          : leafDefinitions(items, itemsBase).map((childDefinition) => ({
              type,
              definition: childDefinition,
            })),
      },
    ];
  }

  if (isObjectSchema(fieldSchema)) {
    return leafDefinitions(fieldSchema, definition).map((leaf) => ({
      type,
      definition: leaf,
    }));
  }

  return [
    {
      type,
      definition,
      ...(options.widget ? { widget: options.widget } : {}),
    },
  ];
};

/** A section name from a group label, shared by the fieldset id and the nav link to it. */
export const groupName = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const groupLabel = (element: UISchemaElement): string | undefined =>
  element.type === "Group" ? (element as GroupLayout).label : undefined;

const convertElement = (
  element: UISchemaElement,
  schema: RJSFSchema,
): UiSchemaNode[] => {
  if (isControlElement(element)) return controlToNodes(element, schema);
  if (!isLayout(element)) return [];

  const children = element.elements.flatMap((child) =>
    convertElement(child, schema),
  );
  const label = groupLabel(element);
  return label
    ? [{ type: "section", name: groupName(label), label, children }]
    : children;
};

/**
 * The section/field tree equivalent to a JSON Forms UI schema, for the code that reads
 * that tree: warning formatting, navigation, and the UI schema validator. The root layout
 * is the form itself, whose title the page already shows, so its elements become the top
 * level.
 */
export const jsonFormsToUiSchema = (
  uiSchema: JsonFormsUiSchema,
  schema: RJSFSchema,
): UiSchema =>
  isLayout(uiSchema)
    ? uiSchema.elements.flatMap((element) => convertElement(element, schema))
    : convertElement(uiSchema, schema);

/** Control scopes no widget can draw, which JSON Forms renders with its own fallback. */
export const unadaptableScopes = (
  uiSchema: JsonFormsUiSchema,
  schema: RJSFSchema,
): string[] => {
  if (isControlElement(uiSchema)) {
    if (!controlToNodes(uiSchema, schema).length) return [uiSchema.scope];
    // A list's entries are laid out by its detail; report a field there no widget draws.
    const layout = entryLayout(uiSchema);
    const definition = scopeToDefinition(uiSchema.scope);
    return layout && definition
      ? droppedEntryScopes(layout, schema, `${definition}/items`).map(
          (scope) => `${uiSchema.scope} -> ${scope}`,
        )
      : [];
  }
  return isLayout(uiSchema)
    ? uiSchema.elements.flatMap((element) => unadaptableScopes(element, schema))
    : [];
};

const droppedEntryScopes = (
  element: UISchemaElement,
  schema: RJSFSchema,
  itemsBase: Definition,
): string[] => {
  if (isControlElement(element)) {
    return entryFields(element, schema, itemsBase).length
      ? []
      : [element.scope];
  }
  return isLayout(element)
    ? element.elements.flatMap((child) =>
        droppedEntryScopes(child, schema, itemsBase),
      )
    : [];
};

/**
 * Rules on fields inside a list, which the field-list widget draws without applying, as
 * `<list scope> -> <field scope>`. Logged so a conditionally disabled field that renders
 * enabled is not a silent difference.
 */
export const unappliedListRules = (uiSchema: JsonFormsUiSchema): string[] => {
  const ruled = (element: UISchemaElement): string[] => [
    ...(element.rule && isControlElement(element) ? [element.scope] : []),
    ...(isLayout(element) ? element.elements.flatMap(ruled) : []),
  ];
  if (isControlElement(uiSchema)) {
    const layout = entryLayout(uiSchema);
    return layout
      ? ruled(layout).map((scope) => `${uiSchema.scope} -> ${scope}`)
      : [];
  }
  return isLayout(uiSchema)
    ? uiSchema.elements.flatMap(unappliedListRules)
    : [];
};
