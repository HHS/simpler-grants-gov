import { ThemeProps } from "@rjsf/core";
import { RJSFSchema, WidgetProps } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";

import { JSX } from "react";

import { wrapSection } from "./fields";
import { UiSchema, UswdsWidgetProps } from "./types";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";
import { get } from "lodash";

export function buildFormTreeClosure(schema: RJSFSchema, uiSchema: UiSchema, errors: string[], formData: object) {
  let acc: JSX.Element[] = [];

  const buildFormTree = (
    uiSchema: UiSchema,
    parent: { label: string; name: string } | null,
  ) => {
    if (
      !Array.isArray(uiSchema) &&
      typeof uiSchema === "object" &&
      "children" in uiSchema
    ) {
      buildFormTree(uiSchema.children, {
        label: uiSchema.label,
        name: uiSchema.name,
      });
    } else if (Array.isArray(uiSchema)) {
      uiSchema.forEach((node) => {
        if ("children" in node) {
          buildFormTree(node.children, {
            label: node.label,
            name: node.name,
          });
        } else if (!parent && "definition" in node) {
          const field = buildField(node.definition, schema, errors, formData);
          if (field) {
            acc = [...acc, field];
          }
        }
      });
      if (parent) {
        // eslint-disable-next-line array-callback-return
        const row = uiSchema.map((node) => {
          if ("children" in node) {
            // TODO: remove children from acc
            // return children from acc;
          } else {
            const { definition } = node as { definition: string };
            return buildField(definition, schema, errors, formData);
          }
        });
        acc = [...acc, wrapSection(parent.label, parent.name, <>{row}</>)];
        // acc = parentHasChild(uiSchema) ? wrapSection(parent.label, parent.name, row) : [acc, wrapSection(parent.label, parent.name, row)];
      }
    }
  };
  buildFormTree(uiSchema, null);
  return acc;
}

const createField = (
  id: string,
  required: boolean | undefined = false,
  minLength: number | null = null,
  maxLength: number | null = null,
  schema: RJSFSchema,
  rawErrors: string[],
  value: string | number | undefined
) => {
  if (maxLength && Number(maxLength) > 255) {
    return TextareaWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength,
      options: {},
      schema,
      rawErrors,
      value
    });
  } else if (schema.enum?.length) {
    return SelectWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {
        enumOptions: schema.enum.map((label, index) => ({
          value: index,
          label: String(label),
        })),
      },
      schema,
      rawErrors,
      value
    });
  } else {
    return TextWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {},
      schema,
      rawErrors,
      value
    });
  }
};

/** 
  const parentHasChild = (uiSchema): boolean => {
    return false;
    // const hasChild = uiSchema.find((node) => node.hasOwnProperty("children")) !== undefined ? true : false;
    // console.log("acc", acc, "ui", uiSchema, "parent", parent, "row", row, "child?", hasChild)
    /// return hasChild;
    // TODO: check JSX elements
    // return false;
  };
   */

//

/**
 * 
 * provides defaults
 *   ui: title, ui: widget, ui:description, ui: help
 * 
 * 
 * 
 * 
 * 1. default to definition
 *    title, type, description, format, minLength, maxLength
 * 2. override with ui:widget
 * 
 * 



const getDefinitions= (definition: string, schema: FormSchema) => {
    const name = definition.split("/")[2];
    if (name) {
        return {}
    }
}
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const theme: ThemeProps = {
  widgets: {
    textarea: ({
      id,
      required,
      minLength,
      maxLength,
      schema,
    }: UswdsWidgetProps) =>
      TextareaWidget({
        id,
        required,
        minLength,
        maxLength,
        options: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        schema,
      }),
    textInput: ({
      id,
      required,
      minLength,
      maxLength,
      schema,
    }: UswdsWidgetProps) =>
      TextWidget({
        id,
        required,
        minLength,
        maxLength,
        options: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        schema,
      }),
    select: ({
      id,
      required,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      schema,
    }: WidgetProps) =>
      SelectWidget({
        id,
        required,
        options: {
          enumOptions:
            schema.enum?.map((label, index) => ({
              value: index,
              label: String(label),
            })) ?? [],
        },
        schema,
      }),
    // processField
    // select
    // radio / checkbox
    //
  },
};


export const buildField = (definition: string, formSchema: RJSFSchema, errors: string[], formData: object) => {
  const name = definition.split("/")[2];
  const schema = getSchemaObjectFromPointer(
    formSchema,
    definition,
  ) as RJSFSchema;
  const rawErrors = errors.find((error) => definition === `/properties${error.instancePath}`);
  // console.log(name, formData)
  const value = get(formData, name) ?? undefined;

  return createField(
    name,
    (formSchema.required ?? []).includes(name),
    schema.minLength,
    schema.maxLength,
    schema,
    rawErrors ? [rawErrors.message] :[],
    value,
  );
};
