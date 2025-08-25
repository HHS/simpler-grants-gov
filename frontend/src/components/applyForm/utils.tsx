import $Refparser from "@apidevtools/json-schema-ref-parser";
import { RJSFSchema, EnumOptionsType } from "@rjsf/utils";
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
import MultiSelectWidget from "./widgets/MultiSelectWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextAreaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

type WidgetOptions = NonNullable<UswdsWidgetProps["options"]>;

// json schema doesn't describe UI so types are inferred if widget not supplied
export const determineFieldType = ({
  uiFieldObject,
  fieldSchema,
}: {
  uiFieldObject: UiSchemaField;
  fieldSchema: RJSFSchema;
}): WidgetTypes => {
  if ("widget" in uiFieldObject && uiFieldObject.widget) {
    return uiFieldObject.widget;
  }

  // 1) Single attachment
  if (fieldSchema.type === "string" && fieldSchema.format === "uuid") {
    return "Attachment";
  }

  // 2) Arrays
  if (fieldSchema.type === "array" && fieldSchema.items) {
    const item = Array.isArray(fieldSchema.items)
      ? fieldSchema.items[0]
      : fieldSchema.items;

    if (item && typeof item === "object") {
      const itemSchema = item as RJSFSchema;

      // 2a) Attachment array
      if (itemSchema.type === "string" && itemSchema.format === "uuid") {
        return "AttachmentArray";
      }

      // 2b) Enum array -> MultiSelect
      if (Array.isArray(itemSchema.enum) && itemSchema.enum.length > 0) {
        return "MultiSelect";
      }
    }

    // 2c) Fallback for other arrays
    return "Select";
  }

  // 3) Single enum -> Select
  if (Array.isArray(fieldSchema.enum) && fieldSchema.enum.length > 0) {
    return "Select";
  }

  // 4) Boolean
  if (fieldSchema.type === "boolean") {
    return "Checkbox";
  }

  // 5) Long text
  if (
    typeof fieldSchema.maxLength === "number" &&
    fieldSchema.maxLength > 255
  ) {
    return "TextArea";
  }

  // 6) Default
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
      .join("--"); // hyphens for html-friendly ids
  }
  return (schema?.title ?? "untitled").replace(/\s/g, "-");
};

// transform a form data field name / id into a json pointer that can be used to reference the form schema
export const getFieldPath = (fieldName: string) =>
  `/${fieldName.replace(/--/g, "/")}`;

const widgetComponents: Record<
  WidgetTypes,
  React.ComponentType<UswdsWidgetProps>
> = {
  Text: TextWidget,
  TextArea: TextAreaWidget,
  Radio: RadioWidget,
  Select: SelectWidget,
  MultiSelect: MultiSelectWidget,
  Checkbox: CheckboxWidget,
  Attachment: AttachmentWidget,
  AttachmentArray: AttachmentArrayWidget,
  Budget424aSectionA,
  Budget424aSectionB,
  Budget424aSectionC,
  Budget424aSectionD,
  Budget424aSectionE,
  Budget424aSectionF,
};

export const getByPointer = (target: object, path: string): unknown => {
  if (!Object.keys(target).length) {
    return undefined;
  }
  try {
    return getSchemaObjectFromPointer(target, path);
  } catch (e) {
    if ((e as Error).message.includes("Invalid reference token:")) {
      return undefined;
    }
    // eslint-disable-next-line no-console
    console.error("error referencing schema path", e, target, path);
    throw e;
  }
};

export const buildField = ({
  errors,
  formSchema,
  formData,
  uiFieldObject,
  requiredField,
}: {
  errors: FormValidationWarning[] | null;
  formSchema: RJSFSchema;
  formData: object;
  uiFieldObject: UiSchemaField;
  requiredField: boolean;
}) => {
  const { definition, schema, type: fieldType } = uiFieldObject;

  let fieldSchema = {} as RJSFSchema;
  let name = "";
  let value: unknown = undefined;
  let rawErrors: string[] | FormValidationWarning[] = [];

  if (fieldType === "multiField" && definition && Array.isArray(definition)) {
    name = uiFieldObject.name ? uiFieldObject.name : "";
    if (!name) {
      // eslint-disable-next-line no-console
      console.error("name missing from multiField definition");
      throw new Error("Could not build field");
    }
    fieldSchema = definition
      .map((def) => getSchemaObjectFromPointer(formSchema, def) as RJSFSchema)
      .reduce((acc, schemaPart) => ({ ...acc, ...schemaPart }), {});
    value = definition
      .map((def) => {
        const defName = getNameFromDef({ definition: def, schema });
        const result = get(formData, defName) as unknown;
        return typeof result === "object" && result !== null
          ? (result as Record<string, unknown>)
          : {};
      })
      .reduce<Record<string, unknown>>(
        (acc, v) => ({ ...acc, ...v }),
        {},
      );
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

    const rawVal = getByPointer(formData, path) as unknown;
    const schemaType =
      typeof fieldSchema?.type === "string"
        ? fieldSchema.type
        : Array.isArray(fieldSchema?.type)
          ? (fieldSchema.type[0] ?? "")
          : "";

    // Normalize value by type (and widget override when it matters)
    const widgetOverride =
      "widget" in uiFieldObject ? uiFieldObject.widget : undefined;

    if (schemaType === "boolean") {
      // If rendered as Radio, use "true"/"false" strings; else keep boolean for Checkbox
      if (
        (widgetOverride ??
          determineFieldType({ uiFieldObject, fieldSchema })) === "Radio"
      ) {
        value =
          typeof rawVal === "boolean"
            ? String(rawVal)
            : typeof rawVal === "string" &&
                (rawVal === "true" || rawVal === "false")
              ? rawVal
              : undefined;
      } else {
        value =
          typeof rawVal === "boolean"
            ? rawVal
            : typeof rawVal === "string"
              ? rawVal === "true"
              : undefined;
      }
    } else if (schemaType === "array") {
      value = Array.isArray(rawVal) ? rawVal.map((v) => String(v)) : [];
    } else {
      value =
        typeof rawVal === "string" || typeof rawVal === "number"
          ? (rawVal as string | number)
          : undefined;
    }

    rawErrors = formatFieldWarnings(errors, name, schemaType, requiredField);
  }

  if (!fieldSchema || typeof fieldSchema !== "object") {
    // eslint-disable-next-line no-console
    console.error("Invalid field schema for:", definition);
    throw new Error("Invalid or missing field schema");
  }

  if ((!name || !fieldSchema) && definition) {
    // eslint-disable-next-line no-console
    console.error("no field name or schema for: ", definition);
    throw new Error("Could not build field");
  }

  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // Optional guardrails for misconfig
  if (type === "Radio" && fieldSchema.type !== "boolean") {
    // eslint-disable-next-line no-console
    console.warn(`Radio widget expects a boolean schema: ${name}`, fieldSchema);
  }
  if (type === "Select" && fieldSchema.type === "array") {
    // eslint-disable-next-line no-console
    console.warn(
      `Array schema detected; did you intend MultiSelect? ${name}`,
    );
  }

  // TODO: move schema mutations to own function
  const disabled = fieldType === "null";
  let options: WidgetOptions = {};

  // Provide enumOptions for Select, MultiSelect, and Radio
  if (type === "Select" || type === "MultiSelect" || type === "Radio") {
    let enums: string[] = [];

    if (fieldSchema.type === "boolean") {
      // Keep as strings to align with RadioWidget hidden input/value handling
      enums = ["true", "false"];
    } else if (fieldSchema.type === "array") {
      const item = Array.isArray(fieldSchema.items)
        ? fieldSchema.items[0]
        : fieldSchema.items;
      if (
        item &&
        typeof item === "object" &&
        Array.isArray((item as { enum?: unknown[] }).enum)
      ) {
        enums = ((item as { enum?: unknown[] }).enum ?? []).map(String);
      }
    } else if (Array.isArray(fieldSchema.enum)) {
      enums = fieldSchema.enum.map(String);
    }

    const enumOptions: EnumOptionsType<RJSFSchema>[] = enums.map(
      (label: string) => {
        const display =
          fieldSchema.type === "boolean"
            ? label === "true"
              ? "Yes"
              : "No"
            : getSimpleTranslationsSync({
                nameSpace: "Form",
                translateableString: label,
              });
        return { value: label, label: display };
      },
    );

    options =
      type === "Select"
        ? ({ enumOptions, emptyValue: "- Select -" } as WidgetOptions)
        : ({ enumOptions } as WidgetOptions);
  }

  // DEBUG: trace the debt radio wiring (safe to remove)
  if (name === "delinquent_federal_debt") {
    // eslint-disable-next-line no-console
    console.log("[424] debt field", {
      type,
      schemaType: fieldSchema.type,
      value,
      options,
    });
  }

  const Widget = widgetComponents[type];
  if (!Widget) {
    // eslint-disable-next-line no-console
    console.error(`Unknown widget type: ${type}`, { definition, fieldSchema });
    throw new Error(`Unknown widget type: ${type}`);
  }

  // Return an element so hooks execute under the AttachmentsProvider context.
  return (
    <Widget
      id={name}
      key={name}
      disabled={disabled}
      required={requiredField}
      minLength={fieldSchema?.minLength}
      maxLength={fieldSchema?.maxLength}
      schema={fieldSchema}
      rawErrors={rawErrors}
      value={value}
      options={options}
    />
  );
};

const getNestedWarningsForField = (
  fieldName: string,
  warnings: FormValidationWarning[],
): FormValidationWarning[] =>
  warnings.filter(({ field, type }) => type === "required" && fieldName.includes(field));

const getWarningsForField = (
  fieldName: string,
  isRequired: boolean,
  warnings: FormValidationWarning[],
): FormValidationWarning[] => {
  const directWarnings = warnings?.filter(
    (warning) => warning.field.indexOf(fieldName) !== -1,
  );
  const nestedRequiredWarnings = isRequired
    ? getNestedWarningsForField(fieldName, warnings)
    : [];
  return [...directWarnings, ...nestedRequiredWarnings];
};

export const formatFieldWarnings = (
  warnings: FormValidationWarning[] | null,
  name: string,
  fieldType: string,
  required: boolean,
): string[] => {
  if (!warnings || warnings.length < 1) {
    return [];
  }
  if (fieldType === "array") {
    const warningMap = warnings.reduce(
      (acc, item) => {
        acc[item.field] = item.message;
        return acc;
      },
      {} as Record<string, unknown>,
    );
    return flatFormDataToArray(name, warningMap) as unknown as [];
  }
  const warningsforField = getWarningsForField(name, required, warnings);
  return warningsforField.map((warning) => warning.message);
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

export const wrapSection = ({
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

const isBasicallyAnObject = (mightBeAnObject: unknown): boolean =>
  !!mightBeAnObject &&
  !isArray(mightBeAnObject) &&
  !isString(mightBeAnObject) &&
  !isNumber(mightBeAnObject);

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
export const pruneEmptyNestedFields = (structuredFormData: object): object =>
  Object.entries(structuredFormData).reduce(
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

const removePropertyPaths = (path: string): string =>
  path.replace(/properties\//g, "").replace(/^\//, "");

const getKeyParentPath = (key: string, parentPath?: string) => {
  const keyParent = parentPath ? `${parentPath}/${key}` : key;
  return removePropertyPaths(keyParent);
};

export const getRequiredProperties = (
  formSchema: RJSFSchema,
  parentPath?: string,
): string[] =>
  Object.entries(formSchema).reduce((requiredPaths, [key, value]) => {
    let acc = requiredPaths;
    if (key === "required") {
      (value as string[]).forEach((requiredPropertyKey: string) => {
        if (!formSchema?.properties) {
          // eslint-disable-next-line no-console
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

export const isFieldRequired = (
  definition: string,
  requiredFields: string[],
): boolean => {
  const path = removePropertyPaths(definition);
  return requiredFields.indexOf(path) > -1;
};

// arrays from the html look like field_[row]_item
const flatFormDataToArray = (
  field: string,
  data: Record<string, unknown>,
) =>
  Object.entries(data).reduce(
    (values: Array<Record<string, unknown>>, [key, value]) => {
      const fieldSplit = key.split(/\[\d+\]\./);
      const fieldName = fieldSplit[0];
      const itemName = fieldSplit[1];

      if (fieldName === field && value) {
        const match = key.match(/[0-9]+/);
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

// dereference/condense schema for easy lookup
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
    // eslint-disable-next-line no-console
    console.error("Error processing schema");
    throw e;
  }
};

export const condenseFormSchemaProperties = (schema: object): object =>
  Object.entries(schema).reduce(
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
