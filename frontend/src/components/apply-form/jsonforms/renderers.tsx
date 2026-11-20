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
  type Layout,
  type LayoutProps,
} from "@jsonforms/core";
import {
  JsonFormsDispatch,
  withJsonFormsControlProps,
  withJsonFormsLayoutProps,
} from "@jsonforms/react";
import type { RJSFSchema } from "@rjsf/utils";
import { addPrintWidgetToFields } from "src/utils/applyForm/applyFormUtils";
import {
  dataPathToDefinition,
  fieldDataPath,
} from "src/utils/applyForm/dataPaths";

import { renderFieldNode } from "src/components/apply-form/FormFields";
import { useAdapterContext } from "./adapterContext";
import { controls } from "./controls";
import { controlToNodes } from "./convertUiSchema";

export { AdapterContext, type AdapterContextValue } from "./adapterContext";

/**
 * A JSON Forms control, rendered by the widget the equivalent section/field node would get.
 * `visible` and `enabled` are JSON Forms' evaluation of the control's rule.
 */
const AdaptedControl = ({ uischema, path, visible, enabled }: ControlProps) => {
  const context = useAdapterContext();
  if (!visible) return null;

  // Read the control at its data path, so a control dispatched below the form's root, like
  // one in a list entry, resolves to its field.
  const control = { ...uischema, scope: `#${dataPathToDefinition(path)}` };
  const nodes = controlToNodes(control, context.schema);
  const rendered = context.print ? addPrintWidgetToFields(nodes) : nodes;

  return (
    <>
      {rendered.map((node) => {
        if (node.type === "section" || node.type === "text") return null;
        return renderFieldNode({
          node,
          schema: context.schema,
          errors: context.errors,
          formData: context.formData,
          requiredFieldPaths: context.requiredFieldPaths,
          formContext: context.formContext,
          isFormLocked: context.isFormLocked,
          disabled: !enabled,
          dataPath:
            "definition" in node && typeof node.definition === "string"
              ? fieldDataPath(path, node.definition)
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

export const adaptedControlTester = rankWith(
  ADAPTER_RANK,
  and(
    isControl,
    // Read the control against the schema it's dispatched with: the form's, or the item
    // schema of a list entry, which a control in the entry is scoped to.
    (uischema, schema) =>
      controlToNodes(uischema as ControlElement, schema as RJSFSchema).length >
      0,
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
