import { RJSFSchema } from "@rjsf/utils";
import { get as getPointer } from "json-pointer";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { filter, get, set } from "lodash";
import merge from "lodash/merge";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";

import { JSX } from "react";

import {
  FormValidationWarning,
  UiSchema,
  UiSchemaField,
  UswdsWidgetProps,
  WidgetTypes,
} from "./types";
import FileUploadWidget from "./widgets/AttachmentUploadWidget";
import CheckboxWidget from "./widgets/CheckboxWidget";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import AttachmentArrayWidget from "./widgets/MultipleAttachmentUploadWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextAreaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

export function getSchemaObjectFromPointer(
  rootSchema: JSONSchema7,
  pointer: string,
): JSONSchema7 | undefined {
  try {
    const tokens = pointer.split("/").filter(Boolean);

    const isObjectSchema = (
      schema: JSONSchema7Definition,
    ): schema is JSONSchema7 => {
      return (
        typeof schema === "object" && schema !== null && !Array.isArray(schema)
      );
    };

    const resolveRef = (schema: JSONSchema7, ref: string): JSONSchema7 => {
      const refPath = ref.replace(/^#/, "");
      const resolved = getPointer(schema, refPath);
      if (!isObjectSchema(resolved)) return {};
      if (resolved.$ref) {
        return resolveRef(schema, resolved.$ref);
      }
      return resolved;
    };

    const resolveAllOf = (schema: JSONSchema7): JSONSchema7 => {
      if (!schema.allOf) return schema;

      const merged = schema.allOf.reduce((acc, subschema) => {
        if (!isObjectSchema(subschema)) return acc;

        let resolved = subschema;
        if (resolved.$ref) {
          resolved = resolveRef(rootSchema, resolved.$ref);
        }
        return merge(acc, resolveAllOf(resolved));
      }, {} as JSONSchema7);

      return merge({}, merged, { ...schema, allOf: undefined });
    };

    let current: any = rootSchema;

    for (const token of tokens) {
      if (!current) return undefined;

      while (current?.$ref) {
        current = resolveRef(rootSchema, current.$ref);
      }

      if (current?.allOf) {
        current = resolveAllOf(current);
      }

      if (current.properties && token in current.properties) {
        current = current.properties[token];
      } else {
        current = current[token];
      }
    }

    while (current?.$ref) {
      current = resolveRef(rootSchema, current.$ref);
    }

    if (current?.allOf) {
      current = resolveAllOf(current);
    }

    if (typeof current !== "object" || Array.isArray(current)) {
      console.warn("Pointer resolved to a non-object:", current);
      return undefined;
    }

    return current;
  } catch (err) {
    console.warn("Failed to resolve pointer:", pointer, err);
    return undefined;
  }
}

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

export const determineFieldType = ({
  uiFieldObject,
  fieldSchema,
}: {
  uiFieldObject: UiSchemaField;
  fieldSchema: RJSFSchema;
}): WidgetTypes => {
  const { widget } = uiFieldObject;
  if (widget) return widget;

  if (fieldSchema.type === "string" && fieldSchema.format === "uuid") {
    return "Attachment";
  }

  if (fieldSchema.type === "array" && fieldSchema.items) {
    const item = Array.isArray(fieldSchema.items)
      ? fieldSchema.items[0]
      : fieldSchema.items;

    if (
      typeof item === "object" &&
      item !== null &&
      item.type === "string" &&
      item.format === "uuid"
    ) {
      return "AttachmentArray";
    }
  }

  if (fieldSchema.enum?.length) return "Select";
  if (fieldSchema.type === "boolean") return "Checkbox";
  if (fieldSchema.maxLength && fieldSchema.maxLength > 255) return "TextArea";

  return "Text";
};

export const getFieldSchema = (
  schema: RJSFSchema,
  field: UiSchemaField,
): RJSFSchema => {
  const base = field.definition
    ? ((getSchemaObjectFromPointer(schema, field.definition) as
        | RJSFSchema
        | undefined) ?? {})
    : {};

  const result = {
    ...base,
    ...(field.schema ?? {}),
  } as RJSFSchema;
  return result;
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
  Attachment: (widgetProps: UswdsWidgetProps) => FileUploadWidget(widgetProps),
  AttachmentArray: (widgetProps: UswdsWidgetProps) =>
    AttachmentArrayWidget(widgetProps),
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
  const fieldSchema = getFieldSchema(formSchema, uiFieldObject);

  const name = definition
    ? definition
        .replace(/^\/properties\//, "") // remove leading prefix
        .replace(/\/properties\//g, ".") // flatten additional nested levels
        .replace(/\//g, ".") // convert any leftover slashes
    : (schema?.title || fieldSchema?.title || "untitled").replace(/\s/g, "-");

  const rawErrors = errors ? formatFieldWarnings(errors, name) : [];
  const value = get(formData, name) as string | number | undefined;
  const type = determineFieldType({ uiFieldObject, fieldSchema });

  const disabled = fieldSchema.type === "null";
  const requiredList = Array.isArray(formSchema.required)
    ? formSchema.required
    : [];
  const isRequired = requiredList.includes(name.split(".").slice(-1)[0]);

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
    required: isRequired,
    minLength: fieldSchema?.minLength ? fieldSchema.minLength : undefined,
    maxLength: fieldSchema?.maxLength ? fieldSchema.maxLength : undefined,
    label: fieldSchema?.title ?? name.replace(/_/g, " "),
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

// filters, orders, and nests the form data to match the form schema
export const shapeFormData = <T extends object>(
  formData: FormData,
  formSchema: RJSFSchema,
): T => {
  const filteredData = Object.fromEntries(
    Array.from(formData.keys())
      .filter((key) => !key.startsWith("$ACTION_"))
      .map((key) => {
        const allValues = formData.getAll(key);
        const value = allValues.length > 1 ? allValues : formData.get(key);

        // Strip empty arrays or empty strings
        if (
          (Array.isArray(value) && value.length === 0) ||
          value === "" ||
          value === null
        ) {
          return [key, undefined];
        }

        return [key, value];
      }),
  );

  const shaped: Record<string, any> = {};

  // Reconstruct nested structure from dotted keys
  Object.entries(filteredData).forEach(([key, value]) => {
    set(shaped, key, value);
  });

  return shaped as T;
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

export const getApplicationIdFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(
    /\/applications\/application\/([a-f0-9-]+)\/form\//,
  );
  return match?.[1] ?? null;
};
