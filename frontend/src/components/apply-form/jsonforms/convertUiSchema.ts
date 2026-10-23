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
} from "src/types/applyForm/types";
import { getByPointer } from "src/utils/formData/formDataUtils";

/*
  Converts a JSON Forms UI schema to the section/field tree that navigation, warnings, print
  and the UI schema validator read.
*/

// --------------------------------------------------
// Types and constants
// --------------------------------------------------

export type JsonFormsUiSchema = UISchemaElement;

/** A JSON Forms UI schema's section/field equivalent, and what the conversion drops. */
export type ConvertedUiSchema = {
  uiSchema: UiSchema;
  /** Controls a widget can't render, which are skipped. */
  unsupportedControls: string[];
  /** Rules on fields inside a list, which the field-list widget doesn't apply. */
  ignoredListRules: string[];
};

type FieldNode = UiSchemaField | UiSchemaFieldList;
type Definition = `/properties/${string}`;
type EntryField = UiSchemaFieldList["children"][number];

/** A top-level property, the only place a field list may sit. */
const ROOT_PROPERTY = /^\/properties\/([^/]+)$/;

/**
 * The SGG widgets `options.widget` may name on a field. Any other name is left off the
 * field, since the UI schema validator would reject it. A custom JSON Forms widget is picked
 * by its own tester, so the field doesn't need its name.
 */
const FIELD_WIDGETS: ReadonlySet<string> = new Set<WidgetTypes>([
  "Attachment",
  "AttachmentArray",
  "Checkbox",
  "Text",
  "TextArea",
  "Radio",
  "Select",
  "MultiSelect",
  "Budget424aSectionA",
  "Budget424aSectionB",
  "Budget424aSectionC",
  "Budget424aSectionD",
  "Budget424aSectionE",
  "Budget424aSectionF",
]);

// --------------------------------------------------
// Conversion
// --------------------------------------------------

/**
 * Converts a JSON Forms UI schema to the section/field tree, and lists what the tree leaves
 * out, so the caller can log it.
 */
export const convertJsonFormsUiSchema = (
  uiSchema: JsonFormsUiSchema,
  schema: RJSFSchema,
): ConvertedUiSchema => ({
  uiSchema: jsonFormsToUiSchema(uiSchema, schema),
  unsupportedControls: findUnsupportedControls(uiSchema, schema),
  ignoredListRules: findIgnoredListRules(uiSchema),
});

/**
 * The section/field tree equivalent to a JSON Forms UI schema, for the code that reads
 * that tree: warning formatting, navigation, and the UI schema validator. The root layout
 * is the form itself, whose title the page already shows, so its elements become the top
 * level.
 */
const jsonFormsToUiSchema = (
  uiSchema: JsonFormsUiSchema,
  schema: RJSFSchema,
): UiSchema =>
  isLayout(uiSchema)
    ? uiSchema.elements.flatMap((element) => convertElement(element, schema))
    : convertElement(uiSchema, schema);

/**
 * The field nodes one JSON Forms control stands for.
 *
 * A control scoped to a scalar is one field. A control scoped to an object is each of the
 * object's leaves, which is how the SGG UI schema lists a composed question. A control
 * scoped to a top-level array of objects is a field list, whose fields follow the control's
 * `options.detail` when it has one and the item schema otherwise. Anything else returns no
 * nodes, and the control is skipped.
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
    widget?: string;
    description?: string;
  };
  // "null" is the SGG field type for a read-only field, which getFieldConfig renders disabled.
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
        // The control's help text is about the list on this form, so it wins over the schema's.
        description: options.description ?? fieldSchema.description,
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
      ...(options.widget && FIELD_WIDGETS.has(options.widget)
        ? { widget: options.widget as WidgetTypes }
        : {}),
    },
  ];
};

/** A section name from a group label, shared by the fieldset id and the nav link to it. */
export const groupName = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// --------------------------------------------------
// What the conversion drops
// --------------------------------------------------

/** Scopes of the controls a widget can't render, which are skipped. */
const findUnsupportedControls = (
  uiSchema: JsonFormsUiSchema,
  schema: RJSFSchema,
): string[] => {
  if (isControlElement(uiSchema)) {
    if (!controlToNodes(uiSchema, schema).length) return [uiSchema.scope];
    // A list's entries are laid out by its detail; report a field there no widget renders.
    const layout = entryLayout(uiSchema);
    const definition = scopeToDefinition(uiSchema.scope);
    return layout && definition
      ? droppedEntryScopes(layout, schema, `${definition}/items`).map(
          (scope) => `${uiSchema.scope} -> ${scope}`,
        )
      : [];
  }
  return isLayout(uiSchema)
    ? uiSchema.elements.flatMap((element) =>
        findUnsupportedControls(element, schema),
      )
    : [];
};

/**
 * Rules on fields inside a list, which the field-list widget renders without applying, as
 * `<list scope> -> <field scope>`. Logged so a conditionally disabled field that renders
 * enabled is not a silent difference.
 */
const findIgnoredListRules = (uiSchema: JsonFormsUiSchema): string[] => {
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
    ? uiSchema.elements.flatMap(findIgnoredListRules)
    : [];
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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

const groupLabel = (element: UISchemaElement): string | undefined =>
  element.type === "Group" ? (element as GroupLayout).label : undefined;

/**
 * A list entry's fields, in the order its `options.detail` lays them out.
 *
 * Scopes inside the detail are relative to one entry, so each control is rebased beneath
 * the list's `items` and then read like any other control. A list nested inside the entry
 * has no field-list equivalent and is left out; `findIgnoredListRules` and
 * `findUnsupportedControls` report what this drops.
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

/** A list control's layout for one entry, when the UI schema gives one. */
const entryLayout = (control: ControlElement): UISchemaElement | undefined => {
  const detail = (control.options as { detail?: unknown } | undefined)?.detail;
  return detail && typeof detail === "object" && "type" in detail
    ? (detail as UISchemaElement)
    : undefined;
};

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
