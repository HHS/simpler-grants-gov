import { EnumOptionsType, RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { get } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";

import {
  BroadlyDefinedWidgetValue,
  FormattedFormValidationWarning,
  SchemaField,
  UiSchemaField,
  UswdsWidgetProps,
  WidgetTypes,
} from "src/components/applyForm/types";
import {
  getByPointer,
  getFieldNameForHtml,
  getFieldPathFromHtml,
  getFieldSchema,
} from "src/components/applyForm/utils";

type WidgetOptions = NonNullable<UswdsWidgetProps["options"]>;

// json schema doesn't describe UI so types are infered if widget not supplied
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

export const getWarningsForField = ({
  errors,
  definition,
}: {
  fieldName: string;
  definition: string;
  fieldType: string;
  errors: FormattedFormValidationWarning[] | null;
}): string[] => {
  if (!errors || errors.length < 1) {
    return [];
  }

  const warningsforField = errors.filter(
    (error) => error.definition === definition,
  );

  return warningsforField.map((warning) => {
    return warning.formatted || warning.message;
  });
};

export const getNameFromDef = ({
  definition,
  schema,
}: {
  definition: string | undefined;
  schema: SchemaField | undefined;
}): string => {
  return definition
    ? definition.split("/")[definition.split("/").length - 1]
    : typeof schema === "object" &&
        schema !== null &&
        "title" in schema &&
        typeof (schema as { title?: string }).title === "string"
      ? ((schema as { title?: string }).title as string).replace(/ /g, "-")
      : "untitled";
};

type FieldInfo<V extends BroadlyDefinedWidgetValue> = {
  value?: V;
  fieldSchema: RJSFSchema;
  rawErrors: string[];
  fieldName: string;
  htmlFieldName: string;
};

const getBasicFieldInfo = ({
  uiFieldObject,
  formSchema,
  formData,
  errors,
}: {
  uiFieldObject: UiSchemaField;
  formSchema: RJSFSchema;
  formData: object;
  errors: FormattedFormValidationWarning[] | null;
}): FieldInfo<string> => {
  const { schema } = uiFieldObject;
  // the definition can be many things, but in this case we should have done the
  // work ahead of time to determine that this definition will be a string
  const definition = uiFieldObject.definition as string;
  if (typeof definition !== "string") {
    throw new Error("attempting to get basic field info for complex field");
  }
  const fieldSchema = getFieldSchema({
    definition,
    schema,
    formSchema,
  }) as RJSFSchema;
  const fieldName = getNameFromDef({ definition, schema });
  const htmlFieldName = getFieldNameForHtml({ definition, schema });
  const formDataPath = getFieldPathFromHtml(htmlFieldName);
  const value = getByPointer(formData, formDataPath) as string;

  const resolvedFieldSchemaType =
    typeof fieldSchema?.type === "string"
      ? fieldSchema.type
      : Array.isArray(fieldSchema?.type)
        ? (fieldSchema.type[0] ?? "")
        : "";

  const rawErrors = getWarningsForField({
    errors,
    fieldName,
    definition,
    fieldType: resolvedFieldSchemaType,
  });

  return {
    value,
    fieldSchema,
    rawErrors,
    fieldName,
    htmlFieldName,
  };
};

const getBasicMultifieldInfo = ({
  uiFieldObject,
  formSchema,
  formData,
  errors,
}: {
  uiFieldObject: UiSchemaField;
  formSchema: RJSFSchema;
  formData: object;
  errors: FormattedFormValidationWarning[] | null;
}): FieldInfo<Record<string, unknown>> => {
  const { schema } = uiFieldObject;
  // the definition can be many things, but in this case we should have done the
  // work ahead of time to determine that this definition will be an array
  const definition = uiFieldObject.definition;
  if (!Array.isArray(definition)) {
    throw new Error("attempting to get multifield field info for basic field");
  }
  const fieldName = uiFieldObject.name ? uiFieldObject.name : "";
  if (!fieldName) {
    console.error("name misssing from multiField definition");
    throw new Error("Could not build field");
  }
  const fieldSchema = definition
    .map((def) => getSchemaObjectFromPointer(formSchema, def) as RJSFSchema)
    .reduce((acc, schema) => ({ ...acc, ...schema }), {});
  const value = definition
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
  // this may not work with nested required fields
  const rawErrors = errors
    ? definition
        .map((def) => {
          const defName = getNameFromDef({ definition: def, schema });
          return errors.filter(
            (warning) => warning.field.indexOf(defName) !== -1,
          ) as unknown as string[];
        })
        .flat()
    : [];
  return {
    value,
    fieldSchema,
    rawErrors,
    fieldName,
    // not used on multifield fields but returning here to keep things symmetrical
    htmlFieldName: "",
  };
};

const getEnumOptions = ({
  widgetType,
  fieldSchema,
}: {
  widgetType: WidgetTypes;
  fieldSchema: RJSFSchema;
}): WidgetOptions => {
  // Provide enumOptions for Select, MultiSelect, and Radio
  if (
    widgetType !== "Select" &&
    widgetType !== "MultiSelect" &&
    widgetType !== "Radio"
  ) {
    console.error("cannot get enums for non enum widget type");
    return {};
  }
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

  return widgetType === "Select"
    ? ({ enumOptions, emptyValue: "- Select -" } as WidgetOptions)
    : ({ enumOptions } as WidgetOptions);
};

// handle complexity of branching for basic vs. multifield config logic
const getFieldInfo = ({
  uiFieldObject,
  formSchema,
  formData,
  errors,
}: {
  uiFieldObject: UiSchemaField;
  formSchema: RJSFSchema;
  formData: object;
  errors: FormattedFormValidationWarning[] | null;
}): FieldInfo<BroadlyDefinedWidgetValue> => {
  const { definition, type: uiSchemaFieldType } = uiFieldObject;

  if (
    uiSchemaFieldType === "multiField" &&
    definition &&
    Array.isArray(definition)
  ) {
    return getBasicMultifieldInfo({
      uiFieldObject,
      formData,
      errors,
      formSchema,
    });
  } else if (typeof definition === "string") {
    return getBasicFieldInfo({
      uiFieldObject,
      formData,
      errors,
      formSchema,
    });
  }
  throw new Error(
    `non basic, non multifield field encountered: ${uiSchemaFieldType}`,
  );
};

export const getFieldConfig = <V extends string | Record<string, unknown>>({
  errors,
  formSchema,
  formData,
  uiFieldObject,
  requiredField,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formSchema: RJSFSchema;
  formData: object;
  uiFieldObject: UiSchemaField;
  requiredField: boolean;
}) => {
  const { definition, type: uiSchemaFieldType } = uiFieldObject;

  const { value, fieldSchema, fieldName, rawErrors, htmlFieldName } =
    getFieldInfo({
      uiFieldObject,
      formData,
      errors,
      formSchema,
    });

  if (!fieldSchema || typeof fieldSchema !== "object") {
    console.error("Invalid field schema for:", definition);
    throw new Error("Invalid or missing field schema");
  }

  // fields that have no definition won't have a name, but will have a schema
  if ((!fieldName || !fieldSchema) && definition) {
    console.error("no field name or schema for: ", definition);
    throw new Error("Could not build field");
  }

  // should filter and match warnings to field earlier in the process
  const widgetType = determineFieldType({ uiFieldObject, fieldSchema });

  // if the widget type requires an option list, generate it here
  const options =
    widgetType === "Select" ||
    widgetType === "MultiSelect" ||
    widgetType === "Radio"
      ? getEnumOptions({
          widgetType,
          fieldSchema,
        })
      : {};

  return {
    type: widgetType,
    props: {
      id: htmlFieldName,
      key: htmlFieldName,
      disabled: uiSchemaFieldType === "null",
      required: requiredField,
      minLength: fieldSchema?.minLength,
      maxLength: fieldSchema?.maxLength,
      schema: fieldSchema,
      rawErrors,
      value: value as V,
      options,
    },
  };
};
