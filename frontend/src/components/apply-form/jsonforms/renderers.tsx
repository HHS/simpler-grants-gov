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
import type { FormattedFormValidationWarning } from "src/types/applyForm/types";
import { addPrintWidgetToFields } from "src/utils/applyForm/applyFormUtils";

import { createContext, useContext } from "react";

import {
  renderFieldNode,
  type RenderFieldNodeProps,
} from "src/components/apply-form/FormFields";
import { wrapSection } from "src/components/apply-form/widgets/WidgetRenderers";
import {
  controlToNodes,
  groupName,
  type JsonFormsUiSchema,
} from "./convertUiSchema";

/*
  JSON Forms supplies layout and rule evaluation; everything it draws is one of our widgets.
  The props a widget needs -- saved values, warnings, the form context -- are ours rather
  than JSON Forms', so they travel through this context instead of JSON Forms' own state.
*/
export type AdapterContextValue = {
  schema: RJSFSchema;
  formData: object;
  errors: FormattedFormValidationWarning[] | null;
  requiredFieldPaths: string[];
  rootUiSchema: JsonFormsUiSchema;
  formContext?: RenderFieldNodeProps["formContext"];
  isFormLocked?: boolean;
  print?: boolean;
};

export const AdapterContext = createContext<AdapterContextValue | null>(null);

const useAdapterContext = (): AdapterContextValue => {
  const value = useContext(AdapterContext);
  if (!value) {
    throw new Error("JSON Forms renderers must be used inside JsonFormsFields");
  }
  return value;
};

/**
 * A JSON Forms control, drawn by the widget the equivalent section/field node would get.
 * `visible` and `enabled` are JSON Forms' evaluation of the control's rule.
 */
const AdaptedControl = ({ uischema, visible, enabled }: ControlProps) => {
  const context = useAdapterContext();
  if (!visible) return null;

  const nodes = controlToNodes(uischema, context.schema);
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
        });
      })}
    </>
  );
};

/**
 * A layout. A labeled group is a section, drawn with the same fieldset the SGG renderer
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
  Ranked below the adapter, so it only matches a control no widget can render. That control
  is skipped: JSON Forms' default input wouldn't match the SGG widgets, and its answer
  wouldn't be saved. getFormData logs each one. Without this entry, JSON Forms would show
  "No applicable renderer found" instead.
*/
const SKIP_RANK = 1;

const SkipControl = () => null;

export const adaptedControlTester = rankWith(
  ADAPTER_RANK,
  and(
    isControl,
    (uischema, _schema, testerContext) =>
      controlToNodes(
        uischema as ControlElement,
        testerContext.rootSchema as RJSFSchema,
      ).length > 0,
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
];
