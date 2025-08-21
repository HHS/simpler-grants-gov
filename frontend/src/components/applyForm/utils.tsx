import $Refparser from "@apidevtools/json-schema-ref-parser";
import { RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { JSONSchema7 } from "json-schema";
import mergeAllOf from "json-schema-merge-allof";
import { filter, get, isArray, isNumber, isObject, isString } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";

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
import AttachmentWidget from "./widgets/AttachmentUploadWidget";
import Budget424aSectionA from "./widgets/budget/Budget424aSectionA";
import Budget424aSectionB from "./widgets/budget/Budget424aSectionB";
import Budget424aSectionC from "./widgets/budget/Budget424aSectionC";
import Budget424aSectionD from "./widgets/budget/Budget424aSectionD";
import Budget424aSectionE from "./widgets/budget/Budget424aSectionE";
import Budget424aSectionF from "./widgets/budget/Budget424aSectionF";
import CheckboxWidget from "./widgets/CheckboxWidget";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import AttachmentArrayWidget from "./widgets/MultipleAttachmentUploadWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextAreaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

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
          const field = buildField({
            uiFieldObject: node,
            formSchema: schema,
            errors: formattedErrors ?? null,
            formData,
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
            return buildField({
              uiFieldObject: node,
              formSchema: schema,
              errors: formattedErrors ?? null,
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

  if (fieldSchema.enum?.length) {
    return "Select";
  } else if (fieldSchema.type === "boolean") {
    return "Checkbox";
  } else if (fieldSchema.maxLength && fieldSchema.maxLength > 255) {
    return "TextArea";
  } else if (fieldSchema.type === "array") {
    return "Select";
  }
  return "Text";
};

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
  return schema as RJSFSchema;
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

// transform a form data field name / id into a json pointer that can be used to reference the form schema
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
  Budget424aSectionC: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionC(widgetProps),
  Budget424aSectionD: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionD(widgetProps),
  Budget424aSectionE: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionE(widgetProps),
  Budget424aSectionF: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionF(widgetProps),
};

export const getByPointer = (target: object, path: string): unknown => {
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
      typeof fieldSchema?.type === "string"
        ? fieldSchema.type
        : Array.isArray(fieldSchema?.type)
          ? (fieldSchema.type[0] ?? "")
          : "",
    );
  }

  if (!fieldSchema || typeof fieldSchema !== "object") {
    console.error("Invalid field schema for:", definition);
    throw new Error("Invalid or missing field schema");
  }

  // fields that have no definition won't have a name, but will havea schema
  if ((!name || !fieldSchema) && definition) {
    console.error("no field name or schema for: ", definition);
    throw new Error("Could not build field");
  }

  // should filter and match warnings to field earlier in the process

  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // TODO: move schema mutations to own function
  const disabled = fieldType === "null";
  let options = {};
  let enums: unknown[] = [];
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

  const Widget = widgetComponents[type];

  // light debugging for unknown widgets
  if (typeof Widget !== "function") {
    console.error(`Unknown widget type: ${type}`, { definition, fieldSchema });
    throw new Error(`Unknown widget type: ${type}`);
  }

  return Widget({
    id: name,
    key: name,
    disabled,
    required: isFieldRequired(name, formSchema),
    minLength: fieldSchema?.minLength,
    maxLength: fieldSchema?.maxLength,
    schema: fieldSchema,
    rawErrors,
    value,
    options,
  });
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
    if ("children" in item && Array.isArray(item.children)) {
      if (item.name && item.label) {
        results.push({ href: `form-section-${item.name}`, text: item.label });
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

const wrapSection = ({
  label,
  fieldName,
  tree,
  description,
}: {
  label: string;
  fieldName: string;
  tree: JSX.Element | undefined;
  description?: string;
}) => {
  const uniqueKey = `${fieldName}-fieldset`;
  return (
    <FieldsetWidget
      key={uniqueKey}
      fieldName={fieldName}
      label={label}
      description={description}
    >
      {tree}
    </FieldsetWidget>
  );
};

const isBasicallyAnObject = (mightBeAnObject: unknown): boolean => {
  return (
    !!mightBeAnObject &&
    !isArray(mightBeAnObject) &&
    !isString(mightBeAnObject) &&
    !isNumber(mightBeAnObject)
  );
};

const isEmptyField = (mightBeEmpty: unknown): boolean => {
  if (mightBeEmpty === undefined) {
    return true;
  }
  return Object.values(mightBeEmpty as object).every((nestedValue) => {
    if (isBasicallyAnObject(nestedValue)) {
      return isEmptyField(nestedValue);
    }
    return !nestedValue;
  });
};

// if a nested field contains no defined items, remove it from the data
// this may not be necessary, as JSON.stringify probably does the same thing
export const pruneEmptyNestedFields = (structuredFormData: object): object => {
  return Object.entries(structuredFormData).reduce(
    (acc, [key, value]) => {
      if (!isBasicallyAnObject(value) && value !== undefined) {
        acc[key] = value;
        return acc;
      }
      if (isEmptyField(value)) {
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
export const shapeFormData = <T extends object>(
  formData: FormData,
  formSchema: RJSFSchema,
): T => {
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_1:0");
  formData.delete("$ACTION_1:1");
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_KEY");
  formData.delete("apply-form-button");

  const structuredFormData = formDataToObject(
    formData,
    condenseFormSchemaProperties(formSchema),
    {
      delimiter: "--",
    },
  );
  return pruneEmptyNestedFields(structuredFormData) as T;
};

const removePropertyPaths = (path: string): string => {
  return path.replace(/properties\//g, "");
};

const getKeyParentPath = (key: string, parentPath?: string) => {
  const keyParent = parentPath ? `${parentPath}/${key}` : key;
  return removePropertyPaths(keyParent);
};

/*
  gets an array of all paths to required fields in the form schema, not
  including any intermediate paths that do not represent actual fields
  assumes a dereferenced but not condensed schema (property paths will still be in place)

  does not do conditionals. For that we'd have to first:
  - gather all conditional rules
  - check all conditional rules against form state / values
  - re-annotate the form schema with new "required" designations
  At that point we're basically running validation
*/
export const getRequiredProperties = (
  formSchema: RJSFSchema,
  parentPath?: string,
): string[] => {
  return Object.entries(formSchema).reduce((requiredPaths, [key, value]) => {
    let acc = requiredPaths;
    if (key === "required") {
      (value as []).forEach((requiredPropertyKey: string) => {
        if (!formSchema?.properties) {
          console.error("Error finding required properties, malformed schema?");
          return;
        }
        const requiredProperty = formSchema.properties[requiredPropertyKey];
        if ((requiredProperty as RJSFSchema).type === "object") {
          const nestedRequiredProperties = getRequiredProperties(
            requiredProperty as RJSFSchema,
            getKeyParentPath(requiredPropertyKey, parentPath),
          );
          acc = acc.concat(nestedRequiredProperties);
          return;
        }
        acc.push(getKeyParentPath(requiredPropertyKey, parentPath));
      });
    }
    return acc;
  }, [] as string[]);
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

// resolve and "allOf" references within "properties" or "$defs" fields
// not merging the entire schema because many schemas have top level
// "allOf" blocks that often contain "if"/"then" statements or other things
// that the mergeAllOf library can't handle out of the box, and we don't need
// to condense in any case
export const processFormSchema = async (
  formSchema: RJSFSchema,
): Promise<RJSFSchema> => {
  try {
    const dereferenced = (await $Refparser.dereference(
      formSchema,
    )) as RJSFSchema;
    const condensedProperties = mergeAllOf({
      properties: dereferenced.properties,
    } as JSONSchema7);
    const condensed = {
      ...dereferenced,
      ...condensedProperties,
    };
    return condensed as RJSFSchema;
  } catch (e) {
    console.error("Error processing schema");
    throw e;
  }
};

/*
  this will flatten any properties objects so that we can directly reference field paths
  within a json schema without traversing nested "properties". Any other object attributes
  and values are unchanged

  ex. { properties: { path: { properties: { nested: 'value' } } } } becomes
      { path: { nested: 'value' } }
*/

export const condenseFormSchemaProperties = (schema: object): object => {
  return Object.entries(schema).reduce(
    (condensed: Record<string, unknown>, [key, value]: [string, unknown]) => {
      if (key === "properties") {
        return {
          ...condensed,
          ...condenseFormSchemaProperties(value as object),
        };
      }
      if (isObject(value) && !isArray(value)) {
        condensed[key] = { ...condenseFormSchemaProperties(value) };
        return condensed;
      }
      condensed[key] = value;
      return condensed;
    },
    {},
  );
};

// This is only needed when extracting an application response from the application endpoint's
// payload. When hitting the applicationForm endpoint this is not necessary. Should we get rid of it?
// the application detail contains an empty array for the form response if no
// forms have been saved or an application_response with a form_id
// export const getApplicationResponse = (
//   forms: [] | ApplicationFormDetail[],
//   formId: string,
// ): ApplicationResponseDetail | object => {
//   if (forms.length > 0) {
//     const form = forms.find((form) => form?.form_id === formId);
//     return form?.application_response || {};
//   } else {
//     return {};
//   }
// };
