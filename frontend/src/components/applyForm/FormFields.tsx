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
  readOnly,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formContext?: RootBudgetFormContext;
  readOnly?: boolean;
}) => {
  try {
    let acc: JSX.Element[] = [];

    const requiredFieldPaths = getRequiredProperties(schema);

    const buildFormTree = (
      uiSchema:
        | UiSchema
        | {
            children: UiSchema;
            label: string;
            name: string;
            description?: string;
          },
      parent: { label: string; name: string; description?: string } | null,
    ) => {
      if (
        !Array.isArray(uiSchema) &&
        typeof uiSchema === "object" &&
        "children" in uiSchema
      ) {
        buildFormTree(uiSchema.children, {
          label: uiSchema.label,
          name: uiSchema.name,
          description: uiSchema.description,
        });
      } else if (Array.isArray(uiSchema)) {
        uiSchema.forEach((node) => {
          if ("children" in node) {
            buildFormTree(node.children as unknown as UiSchema, {
              label: node.label,
              name: node.name,
              description: node.description,
            });
          } else if (!parent && ("definition" in node || "schema" in node)) {
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
              props: {
                ...widgetConfig.props,
                formContext,
                readOnly,
                disabled: readOnly,
              },
              definition: node.definition,
            });

            if (field) {
              acc = [
                ...acc,
                <React.Fragment key={node.name}>{field}</React.Fragment>,
              ];
            }
          }
        });

        if (parent) {
          const childAcc: JSX.Element[] = [];
          const keys: number[] = [];
          const row = uiSchema.map((node) => {
            if ("children" in node) {
              acc.forEach((item, key) => {
                if (item && item.key === `${node.name}-wrapper`) {
                  keys.push(key);
                }
              });
              return null;
            } else {
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
                props: {
                  ...widgetConfig.props,
                  formContext,
                  readOnly,
                  disabled: readOnly,
                },
                definition: node.definition,
              });
            }
          });

          if (keys.length) {
            keys.forEach((key) => {
              childAcc.push(acc[key]);
              delete acc[key];
            });
            acc = [
              ...acc,
              wrapSection({
                label: parent.label,
                fieldName: parent.name,
                description: parent.description,
                tree: <>{childAcc}</>,
              }),
            ];
          } else {
            acc = [
              ...acc,
              wrapSection({
                label: parent.label,
                fieldName: parent.name,
                tree: <>{row}</>,
                description: parent.description,
              }),
            ];
          }
        }
      }
    };

    buildFormTree(uiSchema, null);
    return acc;
  } catch (e) {
    console.error(e);
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }
};
