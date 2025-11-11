import { RJSFSchema } from "@rjsf/utils";

import React, { JSX } from "react";
import { Alert } from "@trussworks/react-uswds";

import { FormattedFormValidationWarning, UiSchema } from "./types";
import {
  getFieldConfig,
  getRequiredProperties,
  isFieldRequired,
} from "./utils";
import { renderWidget, wrapSection } from "./widgets/WidgetRenderers";

type RootBudgetFormContext = {
  rootSchema: RJSFSchema;
  rootFormData: unknown;
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
}: {
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formContext?: RootBudgetFormContext;
}) => {
  let renderedFields: JSX.Element[] = [];
  let requiredFieldPaths = [];

  try {
    requiredFieldPaths = getRequiredProperties(schema);
  } catch (e) {
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
      throw new Error("ui schema element is not an array");
    }

    // generate fields for all schema elements that are not children of a section
    uiSchema.forEach((node) => {
      if ("children" in node) {
        // treat as section
        buildFormTree(node.children as unknown as UiSchema, {
          label: node.label,
          name: node.name,
          description: node.description,
        });
      } else if (!("definition" in node || "schema" in node)) {
        throw new Error("child field missing definition and schema");
      } else if (!parent) {
        // treat as valid non-child field
        const requiredField = isFieldRequired(
          (node.definition || node.schema.title || "") as string,
          requiredFieldPaths,
        );
        const widgetConfig = getFieldConfig({
          uiFieldObject: node,
          formSchema: schema,
          errors: errors ?? null,
          formData,
          requiredField,
        });

        const field = renderWidget({
          type: widgetConfig.type,
          props: { ...widgetConfig.props, formContext },
          definition: node.definition,
        });

        if (field) {
          renderedFields = [
            ...renderedFields,
            <React.Fragment key={node.name}>{field}</React.Fragment>,
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
        if (!("definition" in node || "schema" in node)) {
          throw new Error("section child is not a defined field");
        }

        const requiredField = isFieldRequired(
          (node.definition || node.schema.title || "") as string,
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
          props: { ...widgetConfig.props, formContext },
          definition: node.definition,
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
  } catch (e) {
    console.error(e);
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }
};
