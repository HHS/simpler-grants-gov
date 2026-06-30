import { RJSFSchema } from "@rjsf/utils";
import {
  FormattedFormValidationWarning,
  UiSchema,
  UiSchemaField,
  UiSchemaFieldList,
  UiSchemaTableMultiField,
  UswdsWidgetProps,
} from "src/types/applyForm/types";
import {
  getRequiredProperties,
  isFieldRequired,
} from "src/utils/applyForm/applyFormUtils";
import { getFieldConfig } from "src/utils/applyForm/getFieldConfig";

import React, { JSX } from "react";
import { Alert } from "@trussworks/react-uswds";

import { renderWidget, wrapSection } from "./widgets/WidgetRenderers";

type RootBudgetFormContext = {
  rootSchema: RJSFSchema;
  rootFormData: unknown;
};

/**
 * Determines whether a UiSchema node represents a renderable field.
 *
 * The UiSchema structure can contain several different node types:
 *
 * - section        > container for grouping fields
 * - field          > a standard renderable field
 * - fieldList      > a repeatable group of fields
 * - multiField     > a specialized widget that can render multiple fields
 * - null           > placeholder / intentionally empty node
 *
 * When traversing the UiSchema tree we must ensure that we only attempt
 * to render nodes that actually represent fields. Attempting to render
 * container nodes (like sections) would cause runtime errors.
 *
 * This helper acts as a **type guard** so that after this
 * function returns `true`, the compiler understands that `node` is a
 * renderable field node.
 *
 * Specifically this narrows the type from:
 *
 *   UiSchemaNode
 *
 * to:
 *
 *   UiSchemaField | UiSchemaFieldList
 *
 * This allows downstream code to safely access properties such as
 * `definition` or `schema` without additional type assertions.
 *
 * Extra context:
 *
 * - `fieldList` nodes are always renderable
 * - `field` nodes contain either `definition` or `schema`
 * - `multiField` nodes can represent specialized widgets such as Table
 * - `section` nodes contain `children` instead and are excluded
 */
const isRenderableFieldNode = (
  node: UiSchema[number],
): node is UiSchemaField | UiSchemaFieldList => {
  return (
    node.type === "fieldList" ||
    node.type === "multiField" ||
    "definition" in node ||
    "schema" in node
  );
};

const isTableMultiField = (
  node: UiSchemaField | UiSchemaFieldList,
): node is UiSchemaTableMultiField => {
  return node.type === "multiField" && node.widget === "Table";
};

/*
  Runs through the UI Schema to produce a rendered array of field widgets and sections
*/
export const FormFields = ({
  errors,
  formData,
  schema,
  uiSchema,
  formContext,
  isFormLocked,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formContext?: RootBudgetFormContext;
  isFormLocked?: boolean;
}) => {
  let renderedFields: JSX.Element[] = [];
  let requiredFieldPaths = [];

  try {
    requiredFieldPaths = getRequiredProperties(schema);
  } catch (e: unknown) {
    console.error(e);
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  const buildFormTree = (
    uiSchema: UiSchema,
    parent: { label: string; name: string; description?: string } | null,
  ) => {
    if (!Array.isArray(uiSchema)) {
      throw new Error("top level UI Schema element must be an array");
    }

    // generate fields for all schema elements that are not children of a section
    uiSchema.forEach((node) => {
      /*
        Only `section` nodes should recurse into `children` here.
        `fieldList` nodes also have `children`, but they are renderable widgets,
        not structural containers, so they must continue through the field-rendering path.
      */
      if (node.type === "section") {
        // treat as section and recursively build child fields
        buildFormTree(node.children, {
          label: node.label,
          name: node.name,
          description: node.description,
        });
      } else if (!isRenderableFieldNode(node)) {
        throw new Error("child field missing definition and schema");
      } else if (!parent) {
        // FieldList is a renderable composite widget and does not have its own
        // field definition path in the same way a standard field node does.
        const requiredField =
          node.type === "fieldList" || isTableMultiField(node)
            ? false
            : isFieldRequired(
                (node.definition || node.schema?.title || "") as string,
                requiredFieldPaths,
              );

        const widgetConfig = getFieldConfig({
          uiFieldObject: node,
          formSchema: schema,
          errors: errors ?? null,
          formData,
          requiredField,
        });

        /*
         * Standard widgets, FieldList, and Table currently share the existing
         * widget-rendering pipeline.
         *
         * Composite widget props are intentionally bridged through
         * `UswdsWidgetProps` here because renderWidget/widgetComponents is the
         * existing shared integration point. The individual widgets receive
         * their more specific prop types inside their component adapters.
         */
        const field = renderWidget({
          type: widgetConfig.type,
          props: {
            ...widgetConfig.props,
            formContext,
            isFormLocked,
          } as unknown as UswdsWidgetProps,
          definition: "definition" in node ? node.definition : undefined,
        });

        if (field) {
          /*
           * Prefer a schema-supplied name for stable React keys.
           * Definition-based fields may not have a name, so their definition
           * is used as the fallback stable identifier.
           */
          const nodeKey =
            node.name ??
            ("definition" in node ? node.definition?.toString() : undefined);

          renderedFields = [
            ...renderedFields,
            /*
              Not every renderable UiSchema node has a `name`.
              Prefer `name` when available, otherwise fall back to the field definition
              so React still receives a stable key for this rendered node.
            */
            <React.Fragment key={nodeKey}>{field}</React.Fragment>,
          ];
        }
      }
    });

    // if top level node is a section, the uiSchema passed will represent the section children,
    // and the section definition will be in the parent. Fields will be rendered (rather than in the
    // iteration above) and wrapped in a section here.
    if (parent) {
      const sectionFields = uiSchema.map((node) => {
        // assume that any child fields of a section are defined fields, no support for sub sections
        if (!isRenderableFieldNode(node)) {
          throw new Error("section child is not a defined field");
        }

        // Some renderable UiSchema nodes are definition-based and do not include an
        // inline `schema` object. Use optional chaining here so required-field checks
        // can safely fall back to the schema title only when it exists.
        //
        // FieldList is a renderable composite widget and does not have its own
        // field definition path in the same way a standard field node does.
        const requiredField =
          node.type === "fieldList" || isTableMultiField(node)
            ? false
            : isFieldRequired(
                (node.definition || node.schema?.title || "") as string,
                requiredFieldPaths,
              );

        const widgetConfig = getFieldConfig({
          uiFieldObject: node,
          formSchema: schema,
          errors: errors ?? null,
          formData,
          requiredField,
        });

        return renderWidget({
          type: widgetConfig.type,
          props: {
            ...widgetConfig.props,
            formContext,
            isFormLocked,
          } as unknown as UswdsWidgetProps,
          definition: "definition" in node ? node.definition : undefined,
        });
      });

      renderedFields = [
        ...renderedFields,
        wrapSection({
          label: parent.label,
          fieldName: parent.name,
          sectionFields: <>{sectionFields}</>,
          description: parent.description,
        }),
      ];
    }
  };

  try {
    buildFormTree(uiSchema, null);
    return renderedFields;
  } catch (error: unknown) {
    console.error(error);
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }
};
