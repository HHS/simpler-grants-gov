import { RJSFSchema } from "@rjsf/utils";
// import { get as getPointer } from "json-pointer";
// import { JSONSchema7, JSONSchema7Definition } from "json-schema";
// import { filter, get, set } from "lodash";
// import merge from "lodash/merge";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { filter, get, isArray, isNumber, isString } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";

import React, { JSX } from "react";

import { formDataToObject } from "./formDataToJson";
import {
  FormValidationWarning,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UswdsWidgetProps,
  WidgetTypes,
} from "./types";
import FileUploadWidget from "./widgets/AttachmentUploadWidget";
import Budget424aSectionA from "./widgets/budget/Budget424aSectionA";
import Budget424aSectionB from "./widgets/budget/Budget424aSectionB";
import AttachmentWidget from "./widgets/AttachmentUploadWidget";
import CheckboxWidget from "./widgets/CheckboxWidget";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import AttachmentArrayWidget from "./widgets/MultipleAttachmentUploadWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import { SectionATableWidget } from "./widgets/SF424A/SectionA";
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
  // json schema describes arrays with dots, our html uses --
  const formattedErrors = errors?.map((error) => {
    error.field = error.field.replace("$.", "").replace(".", "--");
    return error;
  });

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
            errors: formattedErrors ?? null,
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
        const row = uiSchema.map((node, index) => {
          if ("children" in node) {
            return null; // handled recursively
          } else {
            const field = buildField({
              uiFieldObject: node,
              formSchema: schema,
              errors: formattedErrors ?? null,
              formData,
            });

            if (!field) {
              console.warn("buildField returned nothing for:", node);
              return null;
            }

            return (
              <React.Fragment key={`${parent?.name || "field"}-${index}`}>
                {field}
              </React.Fragment>
            );
          }
        });
        if (keys.length) {
          keys.forEach((key) => {
            childAcc.push(acc[key]);
            delete acc[key];
          });
          acc = [
            ...acc,
            wrapSection(
              parent.label,
              parent.name,
              <React.Fragment key={`${parent.name}-section`}>
                {childAcc}
              </React.Fragment>,
            ),
          ];
        } else {
          acc = [
            ...acc,
            wrapSection(
              parent.label,
              parent.name,
              <React.Fragment key={`${parent.name}-section`}>
                {row}
              </React.Fragment>,
            ),
          ];
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

  // if (fieldSchema.type === "string" && fieldSchema.format === "uuid") {
  //   return "Attachment";
  if (fieldSchema.enum?.length) {
    return "Select";
  } else if (fieldSchema.type === "boolean") {
    return "Checkbox";
  } else if (fieldSchema.maxLength && fieldSchema.maxLength > 255) {
    return "TextArea";
  } else if (fieldSchema.type === "array") {
    return "Select";
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

// export const getFieldSchema = (
//   schema: RJSFSchema,
//   field: UiSchemaField,
// ): RJSFSchema => {
//   const base = field.definition
//     ? ((getSchemaObjectFromPointer(schema, field.definition) as
//         | RJSFSchema
//         | undefined) ?? {})
//     : {};

//   const result = {
//     ...base,
//     ...(field.schema ?? {}),
//   } as RJSFSchema;
//   return result;
// either schema or definition is required, and schema fields take precedence
export const getFieldSchema = ({
  definition,
  schema,
  formSchema,
}: {
  definition: `/properties/${string}` | undefined;
  schema: SchemaField | undefined;
  formSchema: RJSFSchema;
}): RJSFSchema => {
  if (definition && schema) {
    return {
      ...(getByPointer(formSchema, definition) as object),
      ...schema,
    } as RJSFSchema;
  } else if (definition) {
    return getByPointer(formSchema, definition) as RJSFSchema;
  }
  // return schema as RJSFSchema;
  if (!base || Object.keys(base).length === 0) {
    console.warn("⚠️ Schema not found for field definition:", field.definition);
  }

  const result = {
    ...base,
    ...(field.schema ?? {}),
  } as RJSFSchema;

  return result;
};

export const getNameFromDef = ({
  definition,
  schema,
}: {
  definition: `/properties/${string}` | undefined;
  schema: SchemaField | undefined;
}) => {
  return definition
    ? definition.split("/")[definition.split("/").length - 1]
    : typeof schema === "object" &&
        schema !== null &&
        "title" in schema &&
        typeof (schema as { title?: string }).title === "string"
      ? ((schema as { title?: string }).title as string).replace(/ /g, "-")
      : "untitled";
};

// new, not used in multifield
export const getFieldName = ({
  definition,
  schema,
}: {
  definition?: string;
  schema?: SchemaField;
}): string => {
  if (definition) {
    const definitionParts = definition.split("/");
    return definitionParts
      .filter((part) => part && part !== "properties")
      .join("--"); // using hyphens since that will work better for html attributes than slashes and will have less conflict with other characters
  }
  return (schema?.title ?? "untitled").replace(/\s/g, "-");
};

export const getFieldPath = (fieldName: string) =>
  `/${fieldName.replace(/--/g, "/")}`;

const widgetComponents: Record<
  WidgetTypes,
  (widgetProps: UswdsWidgetProps) => JSX.Element
> = {
  Text: (widgetProps: UswdsWidgetProps) => TextWidget(widgetProps),
  TextArea: (widgetProps: UswdsWidgetProps) => TextAreaWidget(widgetProps),
  Radio: (widgetProps: UswdsWidgetProps) => RadioWidget(widgetProps),
  Select: (widgetProps: UswdsWidgetProps) => SelectWidget(widgetProps),
  Checkbox: (widgetProps: UswdsWidgetProps) => CheckboxWidget(widgetProps),
  Attachment: (widgetProps: UswdsWidgetProps) => AttachmentWidget(widgetProps),
  AttachmentArray: (widgetProps: UswdsWidgetProps) =>
    AttachmentArrayWidget(widgetProps),
  Budget424aSectionA: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionA(widgetProps),
  Budget424aSectionB: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionB(widgetProps),
  SectionATable: (widgetProps: UswdsWidgetProps) =>
    SectionATableWidget(widgetProps),
};

const getByPointer = (target: object, path: string): unknown => {
  if (!Object.keys(target).length) {
    return;
  }
  try {
    return getSchemaObjectFromPointer(target, path);
  } catch (e) {
    // this is not ideal, but it seems like the desired behavior is to return undefined if the
    // path is not found on the target, and the library throws an error instead
    if ((e as Error).message.includes("Invalid reference token:")) {
      return undefined;
    }
    console.error("error referencing schema path", e, target, path);
    throw e;
  }
};

// this is going to need to get much more complicated to figure out if
// nested and conditionally required fields are required
const isFieldRequired = (fieldName: string, formSchema: RJSFSchema) => {
  return (formSchema.required ?? []).includes(fieldName);
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
  // const { definition, schema } = uiFieldObject;
  // const fieldSchema = getFieldSchema(formSchema, uiFieldObject);

  // const name = definition
  //   ? definition
  //       .replace(/^\/properties\//, "") // remove leading prefix
  //       .replace(/\/properties\//g, ".") // flatten additional nested levels
  //       .replace(/\//g, ".") // convert any leftover slashes
  //   : (schema?.title || fieldSchema?.title || "untitled").replace(/\s/g, "-");
  const { definition, schema, type: fieldType } = uiFieldObject;

  let fieldSchema = {} as RJSFSchema;
  let name = "";
  let value = "" as string | number | object | undefined;
  let rawErrors: string[] | FormValidationWarning[] = [];

  if (fieldType === "multiField" && definition && Array.isArray(definition)) {
    name = uiFieldObject.name ? uiFieldObject.name : "";
    if (!name) {
      console.error("name misssing from multiField definition");
      throw new Error("Could not build field");
    }
    fieldSchema = definition
      .map((def) => getSchemaObjectFromPointer(formSchema, def) as RJSFSchema)
      .reduce((acc, schema) => ({ ...acc, ...schema }), {});
    value = definition
      .map((def) => {
        const defName = getNameFromDef({ definition: def, schema });
        const result = get(formData, defName) as unknown;
        return typeof result === "object" && result !== null
          ? (result as Record<string, unknown>)
          : {};
      })
      .reduce<Record<string, unknown>>(
        (acc, value) => ({ ...acc, ...value }),
        {},
      );
    // multifield needs to retain field location for errors.
    rawErrors = definition
      .map((def) => {
        const defName = getNameFromDef({ definition: def, schema });
        return filter(
          errors,
          (warning) => warning.field.indexOf(defName) !== -1,
        ) as unknown as string[];
      })
      .flat();
  } else if (typeof definition === "string") {
    fieldSchema = getFieldSchema({ definition, schema, formSchema });
    name = getFieldName({ definition, schema });
    const path = getFieldPath(name);
    value = getByPointer(formData, path) as string | number | undefined;
    rawErrors = formatFieldWarnings(
      errors,
      name,
      typeof fieldSchema.type === "string"
        ? fieldSchema.type
        : Array.isArray(fieldSchema.type)
          ? (fieldSchema.type[0] ?? "")
          : "",
    );
  }
  // fields that have no definition won't have a name, but will havea schema
  if ((!name || !fieldSchema) && definition) {
    console.error("no field name or schema for: ", definition);
    throw new Error("Could not build field");
  }

  // should filter and match warnings to field earlier in the process

  // const name = definition
  //   ? definition
  //       .replace(/^\/properties\//, "")
  //       .replace(/\/properties\//g, ".")
  //       .replace(/\//g, ".")
  //   : (schema?.title || fieldSchema?.title || "untitled").replace(/\s/g, "-");

  // const rawErrors = errors ? formatFieldWarnings(errors, name) : [];
  // const value = get(formData, name);
  const type = determineFieldType({ uiFieldObject, fieldSchema });

  const disabled = fieldSchema.type === "null";
  const requiredList = Array.isArray(formSchema.required)
    ? formSchema.required
    : [];
  const isRequired = requiredList.includes(name.split(".").slice(-1)[0]);

  // let options = {};
  let enums: unknown[] = [];
  let options: Record<string, any> = {};

  if (type === "Select") {
    if (fieldSchema.type === "array") {
      if (
        fieldSchema.items &&
        typeof fieldSchema.items === "object" &&
        "enum" in fieldSchema.items &&
        Array.isArray((fieldSchema.items as { enum?: unknown[] }).enum)
      ) {
        enums = (fieldSchema.items as { enum?: unknown[] }).enum ?? [];
      }
    } else {
      enums = fieldSchema.enum ?? [];
    }
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
    // required: isRequired,
    // required: (formSchema.required ?? []).includes(name),
    required: isFieldRequired(name, formSchema),
    minLength: fieldSchema?.minLength ? fieldSchema.minLength : undefined,
    maxLength: fieldSchema?.maxLength ? fieldSchema.maxLength : undefined,
    label: fieldSchema?.title ?? name.replace(/_/g, " "),
    schema: fieldSchema,
    rawErrors,
    value,
    options,
  });
  // if (uiFieldObject.options) {
  //   options = {
  //     ...options,
  //     ...uiFieldObject.options,
  //   };
  // }

  // // DEBUGGING: field rendering details
  // // console.warn("BUILD FIELD:", {
  // //   name,
  // //   definition,
  // //   type,
  // //   value,
  // //   fieldSchema,
  // //   uiFieldObject,
  // // });

  // if (!widgetComponents[type]) {
  //   console.warn("Unknown widget type:", type, "for field", name);
  //   return <div style={{ color: "red" }}>Unknown widget: {type}</div>;
  // }

  // try {
  //   return widgetComponents[type]({
  //     id: name,
  //     disabled,
  //     required: isRequired,
  //     minLength: fieldSchema?.minLength,
  //     maxLength: fieldSchema?.maxLength,
  //     label: fieldSchema?.title ?? name.replace(/_/g, " "),
  //     schema: fieldSchema,
  //     rawErrors,
  //     value,
  //     options,
  //   });
  // } catch (err) {
  //   console.error("Widget rendering failed:", type, name, err);
  //   return <div style={{ color: "red" }}>Widget failed: {name}</div>;
  // }
};

const formatFieldWarnings = (
  warnings: FormValidationWarning[] | null,
  name: string,
  type: string,
): string[] => {
  if (!warnings || warnings.length < 1) {
    return [];
  }
  if (type === "array") {
    const data = warnings.reduce(
      (acc, item) => {
        const field = item.field.replace(/^\$\./, "");
        acc[field] = item.message;
        return acc;
      },
      {} as Record<string, unknown>,
    );
    return flatFormDataToArray(name, data) as unknown as [];
  }
  const warningsforField = filter(
    warnings,
    (warning) => warning.field.indexOf(name) !== -1,
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
  // DEBUGGING: field prop details
  // console.warn("wrapSection:", { label, fieldName, tree });
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
// export const shapeFormData = <T extends object>(
//   formData: FormData,
//   formSchema: RJSFSchema,
// ): T => {
//   const filteredData = Object.fromEntries(
//     Array.from(formData.keys())
//       .filter((key) => !key.startsWith("$ACTION_"))
//       .map((key) => {
//         const allValues = formData.getAll(key);
//         const value = allValues.length > 1 ? allValues : formData.get(key);
// export const shapeFormData = <T extends object>(
//   formData: FormData,
//   _formSchema: RJSFSchema,
// ): T => {
//   const filteredData = Object.fromEntries(
//     Array.from(formData.keys())
//       .filter((key) => !key.startsWith("$ACTION_"))
//       .map((key) => {
//         const allValues = formData.getAll(key);
//         const value = allValues.length > 1 ? allValues : formData.get(key);

//         // Strip empty arrays or empty strings
//         if (
//           (Array.isArray(value) && value.length === 0) ||
//           value === "" ||
//           value === null
//         ) {
//           return [key, undefined];
//         }

//         return [key, value];
//       }),
const isBasicallyAnObject = (mightBeAnObject: unknown): boolean => {
  return (
    !!mightBeAnObject &&
    !isArray(mightBeAnObject) &&
    !isString(mightBeAnObject) &&
    !isNumber(mightBeAnObject)
  );
};

  // const shaped: Record<string, any> = {};

  // // Reconstruct nested structure from dotted keys
  // Object.entries(filteredData).forEach(([key, value]) => {
  //   set(shaped, key, value);
  // });

  // return shaped as T;
// if a nested field contains no defined items, remove it from the data
// this may not be necessary, as JSON.stringify probably does the same thing
export const pruneEmptyNestedFields = (structuredFormData: object): object => {
  return Object.entries(structuredFormData).reduce(
    (acc, [key, value]) => {
      if (!isBasicallyAnObject(value)) {
        acc[key] = value;
        return acc;
      }
      const isEmptyObject = Object.values(value as object).every(
        (nestedValue) => !nestedValue,
      );
      if (isEmptyObject) {
        return acc;
      }
      const pruned = pruneEmptyNestedFields(value as object);
      acc[key] = pruned;
      return acc;
    },
    {} as { [key: string]: unknown },
  );
};

// filters, orders, and nests the form data to match the form schema
export const shapeFormData = <T extends object>(formData: FormData): T => {
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_1:0");
  formData.delete("$ACTION_1:1");
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_KEY");
  formData.delete("apply-form-button");

  const structuredFormData = formDataToObject(formData, {
    delimiter: "--",
  });
  return pruneEmptyNestedFields(structuredFormData) as T;
};

// arrays from the html look like field_[row]_item
const flatFormDataToArray = (field: string, data: Record<string, unknown>) => {
  return Object.entries(data).reduce(
    (values: Array<Record<string, unknown>>, CV) => {
      const value = CV[1];
      const fieldSplit = CV[0].split(/\[\d+\]\./);
      const fieldName = fieldSplit[0];
      const itemName = fieldSplit[1];

      if (fieldName === field && value) {
        const match = CV[0].match(/[0-9]+/);
        const arrayNumber = match ? Number(match[0]) : -1;
        if (!values[arrayNumber]) {
          values[arrayNumber] = {};
        }
        values[arrayNumber][itemName] = value;
      }

      return values;
    },
    [] as Array<Record<string, unknown>>,
  );
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
