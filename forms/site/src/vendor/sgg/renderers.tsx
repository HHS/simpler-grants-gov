// TEMPORARY COPY of the pending frontend/src/components/apply-form/jsonforms/renderers.tsx,
// so the form library can render with the SGG form widgets before the JSON Forms renderer
// lands in the frontend. The library also forwards native FieldList callbacks to its
// live preview without a second DOM writer. Reconcile this delta with #12695.
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
import { vanillaRenderers } from "@jsonforms/vanilla-renderers";
import type { RJSFSchema } from "@rjsf/utils";
import { wrapSection } from "@sgg/frontend/components/apply-form/widgets/WidgetRenderers";
import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
import { addPrintWidgetToFields } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { createContext, useContext } from "react";

import {
  controlToNodes,
  groupName,
  type JsonFormsUiSchema,
} from "./jsonFormsUiSchema";
import { renderFieldNode, type RootBudgetFormContext } from "./renderFieldNode";

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
  formContext?: RootBudgetFormContext;
  isFormLocked?: boolean;
  print?: boolean;
  /** The preview lists' draft-value callback; only top-level lists are supported here. */
  onFieldListChange?: (name: string, values: unknown[]) => void;
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
        const listChange =
          node.type === "fieldList" && context.onFieldListChange
            ? (value: unknown) => {
                if (!Array.isArray(value))
                  throw new Error("FieldList must report an array");
                context.onFieldListChange!(node.name, value);
              }
            : undefined;
        const rendered = renderFieldNode({
          node,
          schema: context.schema,
          errors: context.errors,
          formData: context.formData,
          requiredFieldPaths: context.requiredFieldPaths,
          formContext: context.formContext,
          isFormLocked: context.isFormLocked,
          disabled: !enabled,
          onChange: listChange,
        });
        // A callback-owned list must not also be overwritten by its bubbling DOM edits.
        return listChange ? (
          <div
            key={node.name}
            onInput={(event) => event.stopPropagation()}
            onChange={(event) => event.stopPropagation()}
          >
            {rendered}
          </div>
        ) : (
          rendered
        );
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

/*
  Ranked above the vanilla set, which stays registered only as a fallback for a control no
  widget can draw. getFormData logs those, because a fallback input carries no form field
  name and so is not saved.
*/
const ADAPTER_RANK = 10;

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
  ...vanillaRenderers,
  {
    tester: adaptedControlTester,
    renderer: withJsonFormsControlProps(AdaptedControl),
  },
  {
    tester: adaptedLayoutTester,
    renderer: withJsonFormsLayoutProps(AdaptedLayout),
  },
];
