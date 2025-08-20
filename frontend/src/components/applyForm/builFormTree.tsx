import { RJSFSchema } from "@rjsf/utils";

import React, { JSX } from "react";

import { FormValidationWarning, UiSchema } from "./types";
import { getFieldConfig } from "./utils";
import { renderWidget, wrapSection } from "./widgets/WidgetRenderers";

export function buildFormTreeRecursive({
  errors,
  formData,
  schema,
  uiSchema,
}: {
  errors: FormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
}) {
  let acc: JSX.Element[] = [];
  // json schema describes arrays with dots, our html uses --
  const formattedErrors = errors?.map((error) => {
    error.field = error.field.replace("$.", "").replace(".", "--");
    return error;
  });

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
          const widgetConfig = getFieldConfig({
            uiFieldObject: node,
            formSchema: schema,
            errors: formattedErrors ?? null,
            formData,
          });
          const field = renderWidget({
            ...widgetConfig,
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
              if (item) {
                if (item.key === `${node.name}-wrapper`) {
                  keys.push(key);
                }
              }
            });
            return null;
          } else {
            const widgetConfig = getFieldConfig({
              uiFieldObject: node,
              formSchema: schema,
              errors: formattedErrors ?? null,
              formData,
            });
            return renderWidget({
              ...widgetConfig,
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
}
