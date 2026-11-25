"use client";

import {
  and,
  isControl,
  or,
  rankWith,
  uiTypeIs,
  type ControlElement,
  type ControlProps,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type Layout,
  type LayoutProps,
  type UISchemaElement,
} from "@jsonforms/core";
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
  withJsonFormsLayoutProps,
} from "@jsonforms/react";
import type { RJSFSchema } from "@rjsf/utils";
import { addPrintWidgetToFields } from "src/utils/applyForm/applyFormUtils";
import {
  dataPathToDefinition,
  fieldDataPath,
  hasListIndex,
} from "src/utils/applyForm/dataPaths";

import { renderFieldNode } from "src/components/apply-form/FormFields";
import { useAdapterContext } from "./adapterContext";
import { controls } from "./controls";
import { controlToNodes, isRequiredInListEntry } from "./convertUiSchema";
import { useFieldHeadingId } from "./headingLevel";

export { AdapterContext, type AdapterContextValue } from "./adapterContext";

/**
 * A JSON Forms control, rendered by the widget the equivalent section/field node would get.
 * `visible` and `enabled` are JSON Forms' evaluation of the control's rule.
 */
const AdaptedControl = (props: ControlProps) => {
  const { uischema, path, visible, enabled } = props;
  const context = useAdapterContext();
  const fieldHeadingId = useFieldHeadingId();
  const jsonFormsData = useJsonForms().core?.data as object | undefined;
  if (!visible) return null;

  // Read the control at its data path, so a control dispatched below the form's root, like
  // one in a list entry, resolves to its field.
  const control = { ...uischema, scope: `#${dataPathToDefinition(path)}` };
  const nodes = controlToNodes(control, context.schema);
  const rendered = context.print ? addPrintWidgetToFields(nodes) : nodes;
  const inEntry = hasListIndex(path);

  return (
    <>
      {rendered.map((node) => {
        if (node.type === "section" || node.type === "text") return null;
        if (inEntry && node.type === "fieldList") return null;
        const definition =
          "definition" in node && typeof node.definition === "string"
            ? node.definition
            : undefined;
        const dataPath = definition
          ? fieldDataPath(path, definition)
          : undefined;
        return renderFieldNode({
          node,
          schema: context.schema,
          errors: context.errors,
          // Read a field in a list entry from JSON Forms' data, which follows added and deleted entries.
          formData: inEntry ? (jsonFormsData ?? {}) : context.formData,
          requiredFieldPaths: context.requiredFieldPaths,
          formContext: context.formContext,
          isFormLocked: context.isFormLocked,
          disabled: !enabled,
          dataPath,
          widgetProps:
            inEntry && definition && dataPath
              ? {
                  required: isRequiredInListEntry(context.schema, definition),
                  additionalDescribedById: fieldHeadingId,
                  updateOnInput: true,
                  // Update JSON Forms' data for a widget that changes without an input event.
                  onChange: (value: unknown) =>
                    props.handleChange(dataPath, value),
                }
              : undefined,
        });
      })}
    </>
  );
};

/**
 * Render a layout's elements in order. `FieldsetControl` renders a labeled group as a
 * section, so this covers the root layout and unlabeled layouts.
 */
const AdaptedLayout = ({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
}: LayoutProps) => {
  if (!visible) return null;
  const layout = uischema as Layout;
  return (
    <>
      {layout.elements.map((element, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={element}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </>
  );
};

const ADAPTER_RANK = 10;

/*
  Ranked below the adapter, so it only matches a control that other widgets can't render, and skips it
  instead of showing "No applicable renderer found". prepareJsonFormsUiSchema logs each one.
*/
const SKIP_RANK = 1;

const SkipControl = () => null;

/**
 * Match a control on a list entry's own value (`#`), like one entry of a list of strings.
 * The form's root schema is an object, so `#` on the whole form still doesn't match.
 */
const isEntryValueControl = (uischema: UISchemaElement, schema: JsonSchema) =>
  (uischema as ControlElement).scope === "#" &&
  typeof schema.type === "string" &&
  schema.type !== "object" &&
  schema.type !== "array";

export const adaptedControlTester = rankWith(
  ADAPTER_RANK,
  and(
    isControl,
    or(
      // Read the control against the schema it's dispatched with: the form's, or the item
      // schema of a list entry, which a control in the entry is scoped to.
      (uischema, schema) =>
        controlToNodes(uischema as ControlElement, schema as RJSFSchema)
          .length > 0,
      isEntryValueControl,
    ),
  ),
);

export const adaptedLayoutTester = rankWith(
  ADAPTER_RANK,
  or(
    uiTypeIs("Group"),
    uiTypeIs("VerticalLayout"),
    uiTypeIs("HorizontalLayout"),
  ),
);

export const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(SKIP_RANK, isControl),
    renderer: SkipControl,
  },
  {
    tester: adaptedControlTester,
    renderer: withJsonFormsControlProps(AdaptedControl),
  },
  {
    tester: adaptedLayoutTester,
    renderer: withJsonFormsLayoutProps(AdaptedLayout),
  },
  ...controls,
];
