import $RefParser from "@apidevtools/json-schema-ref-parser";
import { RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { filter, get } from "lodash";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";

import { JSX } from "react";

import {
  FieldErrors,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UswdsWidgetProps,
  WidgetTypes,
} from "./types";
import CheckboxWidget from "./widgets/CheckboxWidget";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextAreaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

// resolves $refs in schemas for single schema object
export const parseSchema = async (
  schema: RJSFSchema,
): Promise<RJSFSchema | undefined> => {
  try {
    return (await $RefParser.dereference(schema)) as RJSFSchema;
  } catch (e) {
    console.error("Error parsing JSON schema", e);
  }
};

export function buildFormTreeRecursive({
  errors,
  formData,
  schema,
  uiSchema,
}: {
  errors: FieldErrors;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
}) {
  let acc: JSX.Element[] = [];

  const buildFormTree = (
    uiSchema: UiSchema | { children: UiSchema; label: string; name: string },
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
          buildFormTree(node.children as unknown as UiSchema, {
            label: node.label,
            name: node.name,
          });
        } else if (!parent && ("definition" in node || "schema" in node)) {
          const field = buildField({
            uiFieldObject: node,
            formSchema: schema,
            errors,
            formData,
          });
          if (field) {
            acc = [...acc, field];
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
            return buildField({
              uiFieldObject: node,
              formSchema: schema,
              errors,
              formData,
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
            wrapSection(parent.label, parent.name, <>{childAcc}</>),
          ];
        } else {
          acc = [...acc, wrapSection(parent.label, parent.name, <>{row}</>)];
        }
      }
    }
  };
  buildFormTree(uiSchema, null);
  return acc;
}

// json schema doesn't describe UI so types are infered if widget not supplied
export const determineFieldType = ({
  uiFieldObject,
  fieldSchema,
}: {
  uiFieldObject: UiSchemaField;
  fieldSchema: RJSFSchema;
}): WidgetTypes => {
  const { widget } = uiFieldObject;
  if (widget) return widget;
  if (fieldSchema.enum?.length) {
    return "Select";
  } else if (fieldSchema.type === "boolean") {
    return "Checkbox";
  } else if (fieldSchema.maxLength && fieldSchema.maxLength > 255) {
    return "TextArea";
  }
  return "Text";
};

// either schema or definition is required, and schema fields take precedence
export const getFieldSchema = ({
  uiFieldObject,
  formSchema,
}: {
  uiFieldObject: UiSchemaField;
  formSchema: RJSFSchema;
}): RJSFSchema => {
  const { definition, schema } = uiFieldObject;
  if (definition && schema) {
    return {
      ...getSchemaObjectFromPointer(formSchema, definition),
      ...(schema as SchemaField),
    } as RJSFSchema;
  } else if (definition) {
    return getSchemaObjectFromPointer(formSchema, definition) as RJSFSchema;
  }
  return schema as RJSFSchema;
};

const widgetFunctions: Record<
  WidgetTypes,
  (widgetProps: UswdsWidgetProps) => JSX.Element
> = {
  Text: (widgetProps: UswdsWidgetProps) => TextWidget(widgetProps),
  TextArea: (widgetProps: UswdsWidgetProps) => TextAreaWidget(widgetProps),
  Radio: (widgetProps: UswdsWidgetProps) => RadioWidget(widgetProps),
  Select: (widgetProps: UswdsWidgetProps) => SelectWidget(widgetProps),
  Checkbox: (widgetProps: UswdsWidgetProps) => CheckboxWidget(widgetProps),
};

export const buildField = ({
  uiFieldObject,
  formSchema,
  errors,
  formData,
}: {
  uiFieldObject: UiSchemaField;
  formSchema: RJSFSchema;
  errors: FieldErrors;
  formData: object;
}) => {
  const { definition, schema } = uiFieldObject;
  const fieldSchema = getFieldSchema({ uiFieldObject, formSchema });
  const name = definition
    ? definition.split("/")[definition.split("/").length - 1]
    : (schema?.title ?? "untitled").replace(" ", "-");

  const rawErrors = formatFieldErrors(errors, definition, name);
  const value = get(formData, name) as string | number | undefined;
  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // TODO: move schema mutations to own function
  const disabled = fieldSchema.type === "null";
  let options = {};
  if (type === "Select") {
    const enums = fieldSchema.enum ? fieldSchema.enum : [];
    options = {
      enumOptions: enums.map((label, index) => ({
        value: String(index + 1),
        label: String(label),
      })),
      emptyValue: "- Select -",
    };
  }

  return widgetFunctions[type]({
    id: name,
    disabled,
    required: (formSchema.required ?? []).includes(name),
    minLength: fieldSchema?.minLength ? fieldSchema.minLength : undefined,
    maxLength: fieldSchema?.maxLength ? fieldSchema.maxLength : undefined,
    schema: fieldSchema,
    rawErrors,
    value,
    options,
  });
};

const formatFieldErrors = (
  errors: FieldErrors,
  definition: string | undefined,
  name: string,
) => {
  const errorsforField = filter(
    errors,
    (error) =>
      definition === `/properties${error.instancePath}` ||
      name === error.params?.missingProperty,
  );
  return errorsforField
    .map((error) => {
      if (definition === `/properties${error.instancePath}`) {
        return error.message;
      }
      return "This required field cannot be blank";
    })
    .filter((error): error is string => error !== undefined);
};

export function getFieldsForNav(
  schema: UiSchema,
): { href: string; text: string }[] {
  const results: { href: string; text: string }[] = [];

  if (!Array.isArray(schema)) return results;
  for (const item of schema) {
    if (
      "children" in item &&
      item.children &&
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      if (item.name && item.label) {
        results.push({ href: item.name, text: item.label });
      }
      if (
        Array.isArray(item.children) &&
        item.children.every((child) => "label" in child && "name" in child)
      ) {
        results.push(...getFieldsForNav(item.children as unknown as UiSchema));
      }
    }
  }

  return results;
}

const wrapSection = (
  label: string,
  fieldName: string,
  tree: JSX.Element | undefined,
) => {
  return (
    <FieldsetWidget
      key={`${fieldName}-wrapper`}
      fieldName={fieldName}
      label={label}
    >
      {tree}
    </FieldsetWidget>
  );
};

// filters, orders, and nests the form data to match the form schema
export const shapeFormData = <T extends object>(
  formData: FormData,
  formSchema: RJSFSchema,
): T => {
  const filteredData = Object.fromEntries(
    Array.from(formData.keys())
      .filter((key) => !key.startsWith("$ACTION_"))
      .map((key) => [
        key,
        formData.getAll(key).length > 1
          ? formData.getAll(key)
          : formData.get(key),
      ]),
  );

  // arrays from FormData() look like item[0]:value or item[0][key]: value
  // this accepts flat objects or strings
  const formDataArrayToArray = (
    field: string,
    data: Record<string, unknown>,
  ) => {
    const result: Array<Record<string, unknown>> | string[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (!key.includes(field)) return;
      const match = key.match(/([a-z]+)\[(\d+)\]?\[?([a-z]+)?]/);
      if (!match?.length) return;
      const dataField = match[1];
      if (dataField !== field) return;
      const dataIndex = Number(match[2]);
      if (Number.isNaN(dataIndex)) return;
      const dataItem = match[3];
      if (dataItem) {
        if (result[dataIndex] && typeof result[dataIndex] === "object") {
          result[dataIndex][dataItem] = value;
        } else {
          result[dataIndex] = { [dataItem]: value };
        }
      } else {
        result[dataIndex] = value as string;
      }
    });
    return result;
  };

  const shapeData = (
    schema: RJSFSchema,
    data: Record<string, unknown>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        if (
          typeof schema.properties[key] !== "boolean" &&
          schema.properties[key].type === "object"
        ) {
          result[key] = shapeData(
            schema.properties[key] as RJSFSchema,
            (data[key] as Record<string, unknown>) || data,
          );
        } else if (
          typeof schema.properties[key] !== "boolean" &&
          schema.properties[key].type === "array" &&
          typeof data === "object"
        ) {
          const arrayData = formDataArrayToArray(key, data);
          result[key] = (arrayData as unknown[]).map((item) =>
            typeof item === "object" &&
            schema.properties &&
            typeof schema.properties[key] !== "boolean" &&
            schema.properties[key].items
              ? shapeData(
                  schema.properties[key].items as RJSFSchema,
                  item as Record<string, unknown>,
                )
              : item,
          );
        } else {
          result[key] = data[key];
        }
      }
    }

    return result;
  };

  return shapeData(formSchema, filteredData) as T;
};

// the application detail contains an empty array for the form response if no
// forms have been saved or an application_response with a form_id
export const getApplicationResponse = (
  forms: [] | ApplicationFormDetail[],
  formId: string,
): ApplicationResponseDetail | object => {
  if (forms.length > 0) {
    const form = forms.find((form) => form?.form_id === formId);
    return form?.application_response || {};
  } else {
    return {};
  }
};
