import { RJSFSchema } from "@rjsf/utils";
import {
  dict,
  get as getSchemaObjectFromPointer,
  set as setSchemaObjectFromPointer,
} from "json-pointer";
import { JSONSchema7Definition } from "json-schema";
import { filter, flatten, get, isArray, isObject } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";
import { OptionalStringDict } from "src/types/generalTypes";

import { JSX } from "react";

import {
  FormValidationWarning,
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

const fieldIdToSchemaPath = (id: string) => `/${id.replace(/--/g, "/")}`;

const getByPointer = (target: object, path: string): unknown => {
  if (!Object.keys(target).length) {
    return;
  }
  try {
    // console.log("trying", target, path);
    return getSchemaObjectFromPointer(target, path);
  } catch (e) {
    if (e.message.includes("Invalid reference token")) {
      return undefined;
    }
    console.error("!!! error referencing schema path", e, target, path);
    throw e;
  }
};

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
      ...(getByPointer(formSchema, definition) as OptionalStringDict),
      ...schema,
    } as RJSFSchema;
  } else if (definition) {
    return getByPointer(formSchema, definition) as RJSFSchema;
  }
  return schema as RJSFSchema;
};

const widgetComponents: Record<
  WidgetTypes,
  (widgetProps: UswdsWidgetProps) => JSX.Element
> = {
  Text: (widgetProps: UswdsWidgetProps) => TextWidget(widgetProps),
  TextArea: (widgetProps: UswdsWidgetProps) => TextAreaWidget(widgetProps),
  Radio: (widgetProps: UswdsWidgetProps) => RadioWidget(widgetProps),
  Select: (widgetProps: UswdsWidgetProps) => SelectWidget(widgetProps),
  Checkbox: (widgetProps: UswdsWidgetProps) => CheckboxWidget(widgetProps),
};

export const getFieldName = (
  definition?: string,
  schema?: SchemaField,
): string => {
  if (definition) {
    const definitionParts = definition.split("/");
    return definitionParts
      .filter((part) => part && part !== "properties")
      .join("--"); // using hyphens since that will work better for html attributes than slashes and will have less conflict with other characters
  }
  return (schema?.title ?? "untitled").replace(" ", "-");
};

export const buildField = ({
  errors,
  formSchema,
  formData,
  uiFieldObject,
}: {
  errors: FormValidationWarning[] | null;
  formSchema: RJSFSchema;
  formData: object;
  uiFieldObject: UiSchemaField;
}) => {
  const { definition, schema } = uiFieldObject;
  const fieldSchema = getFieldSchema({ uiFieldObject, formSchema });
  const name = getFieldName(definition, schema);
  const pathToField = fieldIdToSchemaPath(name);

  const rawErrors = errors ? formatFieldWarnings(errors, name) : [];
  const value = getByPointer(formData, pathToField) as
    | string
    | number
    | undefined;
  console.log("****", formData, pathToField, value);
  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // TODO: move schema mutations to own function
  const disabled = fieldSchema.type === "null";
  let options = {};
  if (type === "Select") {
    const enums = fieldSchema.enum ? fieldSchema.enum : [];
    options = {
      enumOptions: enums.map((label) => ({
        value: String(label),
        label: getSimpleTranslationsSync({
          nameSpace: "Form",
          translateableString: String(label),
        }),
      })),
      emptyValue: "- Select -",
    };
  }

  return widgetComponents[type]({
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

const formatFieldWarnings = (
  warnings: FormValidationWarning[],
  name: string,
) => {
  const warningsforField = filter(
    warnings,
    (warning) => `$.${name}` === warning.field,
  );
  return warningsforField.map((warning) => {
    return warning.message;
  });
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

const formatAndFilterFormData = (
  formData: FormData,
): { [k: string]: FormDataEntryValue | FormDataEntryValue[] | null } => {
  return Array.from(formData.keys())
    .filter((key) => !key.startsWith("$ACTION_"))
    .reduce((structuredFormData, key) => {
      const value =
        formData.getAll(key).length > 1
          ? formData.getAll(key)
          : formData.get(key);
      const path = fieldIdToSchemaPath(key);
      setSchemaObjectFromPointer(structuredFormData, path, value);
      return structuredFormData;
    }, {});
};

/*
  translates array data values from form data into more normally formatted arrays
  arrays from FormData() look like item[0]:value or item[0][key]: value
  this accepts flat objects or strings

  takes a path to a schema property and a formatted form data object
*/
const formDataArrayToArray = (
  path: string,
  data: Record<string, unknown>,
): Array<Record<string, unknown>> | string[] => {
  const result: Array<Record<string, unknown>> | string[] = [];
  const pathParts = path.split("/");
  // the form data
  const field = pathParts[pathParts.length - 1];
  Object.entries(data).forEach(([key, value]) => {
    if (!key.includes(field)) return;
    // regex is meant to match something like `item[0]` or `item[0][key]`
    const match = key.match(/([a-z]+)\[(\d+)\]?\[?([a-z]+)?]/);
    if (!match?.length) return;
    // first capture group should match the passed field name
    const dataField = match[1];
    if (dataField !== field) return;
    const dataIndex = Number(match[2]);
    if (Number.isNaN(dataIndex)) return;
    const dataItem = match[3];
    // if the array values are objects, create a new result entry for the key
    // or add to it
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

// note that paths in calls to json-pointer get must be prefixed with a slash,
// so we will add that prefix to all returned paths here
const getPropertyPaths = (
  properties: {
    [key: string]: JSONSchema7Definition;
  },
  prefix = "/",
): string[] => {
  const allPaths = Object.entries(properties).map(
    ([propertyKey, propertyValue]) => {
      if (
        !isObject(propertyValue) ||
        !Object.keys(propertyValue).includes("properties")
      ) {
        return `${prefix}${propertyKey}`;
        // return prefix ? `${prefix}${propertyKey}` : propertyKey;
      }
      // const newPrefix = prefix ? `${prefix}${propertyKey}/` : `${propertyKey}/`;
      return getPropertyPaths(
        propertyValue.properties,
        `${prefix}${propertyKey}/`,
      );
    },
  );
  return flatten(allPaths);
  // return allPaths.reduce((flattenedPaths, pathOrNestedPaths) => {
  //   if (!isArray(pathOrNestedPaths)) {
  //     return flattenedPaths.concat([pathOrNestedPaths])
  //   }
  //   const
  // }, [])
};

const shapeData = (
  schema: RJSFSchema,
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (schema.properties) {
    const { properties } = schema;
    const propertyPaths = getPropertyPaths(properties);
    for (const path of propertyPaths) {
      // getPropertyPaths spits out all paths with nested delimited by slashes
      // since schema nesting is delimited by `/property` we need to massage that value here
      const propertyPath = path.replace(/(?<=.+)\//g, "/property/");
      const propertyValueAtPath: unknown = getByPointer(
        properties,
        propertyPath,
      );
      const dataValueAtPath: unknown = getByPointer(data, path);
      try {
        if (
          typeof propertyValueAtPath !== "boolean" &&
          propertyValueAtPath.type === "object"
        ) {
          setSchemaObjectFromPointer(
            result,
            path,
            shapeData(
              propertyValueAtPath as RJSFSchema,
              (dataValueAtPath as Record<string, unknown>) || data,
            ),
          );
        } else if (
          typeof propertyValueAtPath !== "boolean" &&
          propertyValueAtPath.type === "array" &&
          typeof data === "object"
        ) {
          const arrayData = formDataArrayToArray(path, data);
          const recursedValue = (arrayData as unknown[]).map((item) =>
            typeof item === "object" &&
            properties &&
            typeof propertyValueAtPath !== "boolean" &&
            propertyValueAtPath.items
              ? shapeData(
                  propertyValueAtPath.items as RJSFSchema,
                  item as Record<string, unknown>,
                )
              : item,
          );
          setSchemaObjectFromPointer(result, path, recursedValue);
        } else if (
          typeof propertyValueAtPath !== "boolean" &&
          propertyValueAtPath.type === "boolean" &&
          typeof data === "object"
        ) {
          // if the schema is a boolean, we need to check if the data has a value
          if (dataValueAtPath === "true" || dataValueAtPath === true) {
            // result[key] = true;
            setSchemaObjectFromPointer(result, path, true);
          } else if (dataValueAtPath === "false" || dataValueAtPath === false) {
            // result[key] = false;
            setSchemaObjectFromPointer(result, path, false);
          } else {
            // result[key] = undefined; // or some default value
            setSchemaObjectFromPointer(result, path, undefined);
          }
          // if the array is flat, just return the values
        } else {
          if (dataValueAtPath) {
            // result[key] = dataValueAtPath;
            setSchemaObjectFromPointer(result, path, dataValueAtPath);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  return result;
};

// filters, orders, and nests the form data to match the form schema
export const shapeFormData = <T extends object>(
  formData: FormData,
  formSchema: RJSFSchema,
): T => {
  const filteredData = formatAndFilterFormData(formData);
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
