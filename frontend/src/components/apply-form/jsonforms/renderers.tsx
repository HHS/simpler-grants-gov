"use client";

import {
  and,
  isControl,
  or,
  rankWith,
  uiTypeIs,
  type ControlElement,
  type ControlProps,
  type GroupLayout,
  type JsonFormsRendererRegistryEntry,
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
import { wrapSection } from "src/components/apply-form/widgets/WidgetRenderers";
import { useAdapterContext } from "./adapterContext";
import { controls } from "./controls";
import { controlToNodes, groupName } from "./convertUiSchema";

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
 * A layout. A labeled group is a section, rendered with the same fieldset the SGG renderer
 * uses; the root layout is the form itself, whose title the page already shows.
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
  const context = useAdapterContext();
  if (!visible) return null;

  const layout = uischema as GroupLayout;
  const children = layout.elements.map((element, index) => (
    <JsonFormsDispatch
      key={`${path}-${index}`}
      uischema={element}
      schema={schema}
      path={path}
      enabled={enabled}
      renderers={renderers}
      cells={cells}
    />
  ));

  if (uischema === context.rootUiSchema || !layout.label) {
    return <>{children}</>;
  }
  const description = layout.options?.description as string | undefined;
  return wrapSection({
    label: layout.label,
    fieldName: groupName(layout.label),
    sectionFields: <>{children}</>,
    description,
  });
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
