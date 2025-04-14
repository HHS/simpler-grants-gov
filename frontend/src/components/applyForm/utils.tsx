import { RJSFSchema } from "@rjsf/utils";
import { ErrorObject } from "ajv";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { filter, get } from "lodash";

import { JSX } from "react";

import { UiSchema, UiSchemaField } from "./types";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

export function buildForTreeRecursive({
  errors,
  formData,
  schema,
  uiSchema,
}: {
  errors: ErrorObject<string, Record<string, unknown>, unknown>[];
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
        } else if (!parent && "definition" in node) {
          const field = buildField({
            fieldObject: node,
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
              fieldObject: node,
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

const createField = ({
  id,
  required = false,
  minLength = null,
  maxLength = null,
  schema,
  rawErrors,
  value,
}: {
  id: string;
  required: boolean | undefined;
  minLength: number | null;
  maxLength: number | null;
  schema: RJSFSchema;
  rawErrors: string[] | undefined;
  value: string | number | undefined;
}) => {
  const disabled = schema.type === "null";
  if (maxLength && Number(maxLength) > 255) {
    return TextareaWidget({
      id,
      disabled,
      required,
      minLength: minLength ?? undefined,
      maxLength,
      options: {},
      schema,
      rawErrors,
      value,
    });
  } else if (schema.enum?.length) {
    return SelectWidget({
      disabled,
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {
        enumOptions: [{ value: "", label: "" }].concat(
          schema.enum.map((label, index) => ({
            value: String(index + 1),
            label: String(label),
          })),
        ),
      },
      schema,
      rawErrors,
      value,
    });
  } else {
    return TextWidget({
      id,
      disabled,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {},
      schema,
      rawErrors,
      value,
    });
  }
};

export const buildField = ({
  fieldObject,
  formSchema,
  errors,
  formData,
}: {
  fieldObject: UiSchemaField;
  formSchema: RJSFSchema;
  errors: ErrorObject<string, Record<string, unknown>, unknown>[];
  formData: object;
}) => {
  const { definition, schema } = fieldObject;
  const name = definition
    ? definition.split("/")[definition.split("/").length - 1]
    : (schema?.title ?? "untitled").replace(" ", "-");
  const fieldSchema = definition
    ? (getSchemaObjectFromPointer(formSchema, definition) as RJSFSchema)
    : schema;
  const rawErrors = formatFieldErrors(errors, definition, name);
  const value = get(formData, name) as string | number | undefined;

  return createField({
    id: name,
    required: (formSchema.required ?? []).includes(name),
    minLength: fieldSchema?.minLength ? fieldSchema.minLength : null,
    maxLength: fieldSchema?.maxLength ? fieldSchema.maxLength : null,
    schema: fieldSchema as RJSFSchema,
    rawErrors,
    value,
  });
};

const formatFieldErrors = (
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
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
