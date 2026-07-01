import { EnumOptionsType, RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { get } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";
import {
  BroadlyDefinedWidgetValue,
  FieldListChildWidgetTypes,
  FieldListGroupItem,
  FieldListWidgetProps,
  FormattedFormValidationWarning,
  GeneralRecord,
  SchemaField,
  TableWidgetProps,
  UiSchemaField,
  UiSchemaFieldList,
  UiSchemaTableMultiField,
  UswdsWidgetProps,
  WidgetTypes,
} from "src/types/applyForm/types";

import {
  getByPointer,
  getFieldNameForHtml,
  getFieldPathFromHtml,
  getFieldSchema,
} from "./applyFormUtils";

type WidgetOptions = NonNullable<UswdsWidgetProps["options"]>;

type FieldInfo<V extends BroadlyDefinedWidgetValue> = {
  value?: V;
  fieldSchema: RJSFSchema;
  rawErrors: string[];
  fieldName: string;
  htmlFieldName: string;
};

const FIELD_LIST_INDEX_TOKEN = "~~index~~" as const;

/**
 * Builds the template id used by FieldList child widgets.
 *
 * FieldList entries are array items, so each rendered child needs an id that
 * includes the entry index:
 *
 *   additional_sites[0]--address--street1
 *
 * At config-build time we do not know the rendered entry index yet, so this
 * helper creates a template id with a placeholder:
 *
 *   additional_sites[~~index~~]--address--street1
 *
 * The FieldList widget replaces `~~index~~` with the actual entry index while
 * rendering.
 */
export function buildFieldListBaseId({
  fieldListName,
  storagePath,
}: {
  fieldListName: string;
  storagePath: string[];
}): string {
  return `${fieldListName}[${FIELD_LIST_INDEX_TOKEN}]--${storagePath.join("--")}`;
}

/**
 * Converts a FieldList child definition into the path where that child value
 * lives inside a single entry object.
 *
 * Example:
 *
 *   /properties/additional_sites/items/properties/address/properties/street1
 *
 * becomes:
 *
 *   ["address", "street1"]
 *
 * Flat children still become a one-part path:
 *
 *   /properties/additional_sites/items/properties/organization_name
 *   -> ["organization_name"]
 */
export function buildFieldListStoragePath({
  fieldListName,
  childDefinition,
}: {
  fieldListName: string;
  childDefinition: string;
}): string[] {
  const fieldListPrefix = `/properties/${fieldListName}/items/properties/`;

  if (!childDefinition.startsWith(fieldListPrefix)) {
    const childDefinitionParts = childDefinition.split("/");
    return [childDefinitionParts[childDefinitionParts.length - 1]];
  }

  return childDefinition
    .replace(fieldListPrefix, "")
    .split("/properties/")
    .filter((pathPart) => pathPart.length > 0);
}

// FieldList currently supports root-level array fields only.
const getFieldListRequiredFields = ({
  formSchema,
  fieldListName,
}: {
  formSchema: RJSFSchema;
  fieldListName: string;
}): string[] => {
  const fieldListSchema = formSchema.properties?.[fieldListName] as
    | RJSFSchema
    | undefined;

  if (!fieldListSchema || fieldListSchema.type !== "array") {
    return [];
  }

  const itemSchema =
    fieldListSchema.items &&
    !Array.isArray(fieldListSchema.items) &&
    typeof fieldListSchema.items === "object"
      ? (fieldListSchema.items as RJSFSchema)
      : undefined;

  if (!itemSchema?.required || !Array.isArray(itemSchema.required)) {
    return [];
  }

  return itemSchema.required.map(
    (requiredFieldName) => `${fieldListName}/${requiredFieldName}`,
  );
};

type FieldWidgetConfig = {
  type: FieldListChildWidgetTypes;
  props: UswdsWidgetProps;
};

type FieldListConfig = {
  type: "FieldList";
  props: FieldListWidgetProps;
};

type TableConfig = {
  type: "Table";
  props: TableWidgetProps;
};

type FieldConfig = FieldWidgetConfig | FieldListConfig | TableConfig;

const isTableMultiField = (
  uiFieldObject: UiSchemaField,
): uiFieldObject is UiSchemaTableMultiField => {
  return (
    uiFieldObject.type === "multiField" &&
    uiFieldObject.widget === "Table" &&
    "table" in uiFieldObject
  );
};

// JSON schema doesn't describe UI, so widget types are inferred when not supplied.
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

// for a non-multifield field, gather all necessary data for rendering
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

// for a multifield field, gather all necessary data for rendering
export const getBasicMultifieldInfo = ({
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
  if (isTableMultiField(uiFieldObject)) {
    throw new Error("attempting to get multifield info for table field");
  }
  const { schema } = uiFieldObject;
  // the definition can be many things, but in this case we should have done the
  // work ahead of time to determine that this definition will be a string
  const definition = uiFieldObject.definition;
  if (!Array.isArray(definition)) {
    throw new Error("attempting to get multifield field info for basic field");
  }
  const fieldName = uiFieldObject.name ? uiFieldObject.name : "";
  if (!fieldName) {
    console.error("name missing from multiField definition");
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
    // not used downstream on sf424a, and not valid see https://github.com/HHS/simpler-grants-gov/issues/8624
    fieldSchema,
    rawErrors,
    fieldName,
    // not used on multifield fields but returning here to keep things symmetrical
    htmlFieldName: "",
  };
};

// if a field is of a type that requires enum options (select, mulitselect, radio)
// this function will format the options correctly based on the json schema
export const getEnumOptions = ({
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
    (enumValue: string) => {
      const label =
        fieldSchema.type === "boolean"
          ? enumValue === "true"
            ? "Yes"
            : "No"
          : getSimpleTranslationsSync({
              nameSpace: "Form",
              translateableString: enumValue,
            });
      return { value: enumValue, label };
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
  if (isTableMultiField(uiFieldObject)) {
    throw new Error("attempting to get field info for table field");
  }
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
  }

  if (typeof definition === "string") {
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

const getFieldListConfig = ({
  errors,
  formSchema,
  formData,
  uiFieldObject,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formSchema: RJSFSchema;
  formData: object;
  uiFieldObject: UiSchemaFieldList;
}): FieldListConfig => {
  const groupDefinition: FieldListGroupItem[] = uiFieldObject.children.map(
    (childNode) => {
      if (childNode.type !== "field" && childNode.type !== "multiField") {
        throw new Error("fieldList children must be field nodes");
      }

      if (!childNode.definition) {
        throw new Error("fieldList child field must include a definition");
      }

      if (Array.isArray(childNode.definition)) {
        throw new Error(
          "fieldList child field definition must be a single path",
        );
      }

      const childWidgetConfig = getFieldConfig({
        errors,
        formSchema,
        formData,
        uiFieldObject: childNode,
        requiredField: false,
      });

      if (childWidgetConfig.type === "FieldList") {
        throw new Error("nested fieldList is not supported");
      }

      if (childWidgetConfig.type === "Table") {
        throw new Error("table inside fieldList is not supported");
      }

      const { value: _value, key: _key, ...rest } = childWidgetConfig.props;

      // Build once so the renderer can use the same path for id generation,
      // value lookup, and nested value updates.
      const storagePath = buildFieldListStoragePath({
        fieldListName: uiFieldObject.name,
        childDefinition: childNode.definition,
      });

      return {
        widget: childWidgetConfig.type,
        baseId: buildFieldListBaseId({
          fieldListName: uiFieldObject.name,
          storagePath,
        }),
        storagePath,
        generalProps: rest,
        definition: childNode.definition,
      };
    },
  );

  const fieldListValue =
    formData && typeof formData === "object" && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)[uiFieldObject.name]
      : undefined;

  const requiredFields = getFieldListRequiredFields({
    formSchema,
    fieldListName: uiFieldObject.name,
  });

  const fieldListSchema = formSchema.properties?.[uiFieldObject.name] as
    | RJSFSchema
    | undefined;

  return {
    type: "FieldList",
    props: {
      id: uiFieldObject.name,
      key: uiFieldObject.name,
      schema: {
        type: "array",
        title: uiFieldObject.label,
        description: uiFieldObject.description,
      },
      label: uiFieldObject.label,
      description: uiFieldObject.description,
      name: uiFieldObject.name,
      minItems: fieldListSchema?.minItems,
      maxItems: fieldListSchema?.maxItems,
      groupDefinition,
      rawErrors: errors ?? [],
      requiredFields,
      value: fieldListValue as GeneralRecord[] | undefined,
      minItemsHeading: uiFieldObject.minItemsHeading,
      minItemsHelperText: uiFieldObject.minItemsHelperText,
      maxItemsHeading: uiFieldObject.maxItemsHeading,
      maxItemsHelperText: uiFieldObject.maxItemsHelperText,
    },
  };
};

/**
 * Validates static table configuration and prepares props for the Table widget.
 *
 * Table cell definitions will be resolved through the shared multiField path
 * when editable and read-only table cell rendering is implemented.
 */
const getTableConfig = ({
  uiFieldObject,
}: {
  uiFieldObject: UiSchemaTableMultiField;
}): TableConfig => {
  const { columns, rows } = uiFieldObject.table;
  let columnWidthTotal = 0;

  columns.forEach((column) => {
    if (typeof column.width === "number") {
      columnWidthTotal += column.width;
    }
  });

  if (columnWidthTotal > 100) {
    throw new Error("Table column widths cannot total more than 100.");
  }

  rows.forEach((row, rowIndex) => {
    if (row.cells.length !== columns.length) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${columns.length} cells.`,
      );
    }
  });

  return {
    type: "Table",
    props: {
      id: uiFieldObject.name,
      key: uiFieldObject.name,
      name: uiFieldObject.name,
      columns,
      rows,
    },
  };
};

// returns widget type and props for rendering data for a given JSON schema field
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
  uiFieldObject: UiSchemaField | UiSchemaFieldList;
  requiredField: boolean;
}): FieldConfig => {
  if (uiFieldObject.type === "fieldList") {
    return getFieldListConfig({
      errors,
      formSchema,
      formData,
      uiFieldObject,
    });
  }

  if (isTableMultiField(uiFieldObject)) {
    return getTableConfig({
      uiFieldObject,
    });
  }

  const { definition } = uiFieldObject;

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

  const widgetType = determineFieldType({
    uiFieldObject,
    fieldSchema,
  });

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
    type: widgetType as FieldListChildWidgetTypes,
    props: {
      id: htmlFieldName,
      key: htmlFieldName,
      disabled: uiFieldObject.type === "null",
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
