import $Refparser from "@apidevtools/json-schema-ref-parser";
import { EnumOptionsType, RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { JSONSchema7 } from "json-schema";
import mergeAllOf from "json-schema-merge-allof";
import { filter, get, isArray, isNumber, isObject, isString } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";

import { formDataToObject } from "./formDataToJson";
import {
  FormattedFormValidationWarning,
  FormValidationWarning,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UiSchemaSection,
  UswdsWidgetProps,
  WidgetTypes,
} from "./types";

type WidgetOptions = NonNullable<UswdsWidgetProps["options"]>;

const nestedWarningForField = ({
  definition,
  errors,
  fieldName,
  fieldSchema,
  formSchema,
  path,
}: {
  definition: string;
  errors: FormValidationWarning[];
  fieldName: string;
  fieldSchema: SchemaField;
  formSchema: RJSFSchema;
  path: string;
}): FormattedFormValidationWarning | null => {
  const parent = definition.replace(/\/properties\/\w+$/, "");
  const parentFieldDefinition = getFieldSchema({
    definition: parent,
    formSchema,
    schema: undefined,
  });

  if (!parentFieldDefinition) return null;

  const error = errors.find(({ field }) => {
    if (
      // field is within parent
      path.includes(field) &&
      path !== field &&
      // field is in the parent required definition
      "required" in parentFieldDefinition &&
      parentFieldDefinition.required?.indexOf(fieldName) !== -1
    )
      return true;
    return false;
  });

  if (error) {
    const message = error.message.replace(/'\S+'/, fieldName);
    const formatted = formatValidationWarning(fieldName, message, fieldSchema);
    const formattedWithParent = parentFieldDefinition.title
      ? `${parentFieldDefinition.title} ${formatted}`
      : formatted;
    const htmlField = getFieldNameForHtml({
      definition,
      schema: fieldSchema,
    });
    return {
      ...error,
      formatted: formattedWithParent,
      htmlField,
      definition,
    };
  }
  return null;
};

const formatValidationWarning = (
  fieldName: string,
  message: string,
  fieldSchema: SchemaField,
) => {
  // some schemas might not have a title
  const title =
    fieldSchema &&
    typeof fieldSchema === "object" &&
    fieldSchema !== null &&
    "title" in fieldSchema
      ? fieldSchema.title
      : null;

  return validationWarningOverrides(message, fieldName, title);
};

const validationWarningOverrides = (
  message: string,
  fieldName: string,
  title?: string | null | undefined,
) => {
  const formattedTitle = title ? title.replace("?", "") : "Field";
  return message
    .replace(fieldName, formattedTitle)
    .replace(/'/g, "")
    .replace("[] should be non-empty", `${formattedTitle} is required`)
    .replace("is a required property", "is required");
};

const findValidationError = (
  errors: FormValidationWarning[],
  definition: string | undefined,
  schema: SchemaField | undefined,
  formSchema: RJSFSchema,
): FormattedFormValidationWarning | null => {
  const fieldSchema = getFieldSchema({
    definition,
    formSchema,
    schema,
  }) as SchemaField;
  const path = definition ? jsonSchemaPointerToPath(definition) : "";
  const fieldName = definition
    ? definition.split("/")[definition.split("/").length - 1]
    : "";
  const directWarning = errors.find((error) => error.field === path);

  if (directWarning) {
    const formatted = formatValidationWarning(
      fieldName,
      directWarning.message,
      fieldSchema,
    );
    const htmlField = getFieldNameForHtml({
      definition,
      schema: fieldSchema,
    });

    return { ...directWarning, formatted, htmlField, definition };
  }
  if (fieldSchema && definition) {
    return nestedWarningForField({
      path,
      definition,
      fieldName,
      errors,
      fieldSchema,
      formSchema,
    });
  }
  return null;
};

export const buildWarningTree = (
  uiSchema:
    | Array<UiSchemaSection | UiSchemaField>
    | UiSchemaSection
    | UiSchemaField,
  parent:
    | Array<UiSchemaSection | UiSchemaField>
    | UiSchemaSection
    | UiSchemaField
    | null,
  formValidationWarnings: FormValidationWarning[],
  formSchema: RJSFSchema,
): FormattedFormValidationWarning[] => {
  if (
    !Array.isArray(uiSchema) &&
    typeof uiSchema === "object" &&
    "children" in uiSchema
  ) {
    return buildWarningTree(
      uiSchema.children,
      uiSchema,
      formValidationWarnings,
      formSchema,
    );
  } else if (Array.isArray(uiSchema)) {
    const childErrors = uiSchema.reduce<FormattedFormValidationWarning[]>(
      (errors, node) => {
        if ("children" in node) {
          const nodeError = buildWarningTree(
            node.children,
            uiSchema,
            formValidationWarnings,
            formSchema,
          );
          return errors.concat(nodeError);
        } else if (!parent && ("definition" in node || "schema" in node)) {
          const error = findValidationError(
            formValidationWarnings,
            Array.isArray(node.definition)
              ? node.definition[0]
              : node.definition,
            node.schema,
            formSchema,
          );
          if (error) {
            return errors.concat([error]);
          }
        }
        return errors;
      },
      [],
    );
    if (parent) {
      const parentErrors = uiSchema.reduce<FormattedFormValidationWarning[]>(
        (errors, node) => {
          if ("children" in node) {
            const nodeError = buildWarningTree(
              node.children,
              uiSchema,
              formValidationWarnings,
              formSchema,
            );
            return errors.concat(nodeError);
          } else {
            const error = findValidationError(
              formValidationWarnings,
              Array.isArray(node.definition)
                ? node.definition[0]
                : node.definition,
              node.schema,
              formSchema,
            );
            if (error) {
              return errors.concat([error]);
            }
            return errors;
          }
        },
        [],
      );
      return childErrors.concat(parentErrors);
    }
    return childErrors;
  }
  return [];
};

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

// either schema or definition is required, and schema fields take precedence
export const getFieldSchema = ({
  definition,
  schema,
  formSchema,
}: {
  definition: string | undefined;
  schema: SchemaField | undefined;
  formSchema: RJSFSchema;
}): RJSFSchema | SchemaField => {
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
  definition: string | undefined;
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
export const getFieldNameForHtml = ({
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

// transform a form data field name / id into a json path that can be used to reference the form schema
export const getFieldPathFromHtml = (fieldName: string) =>
  `/${fieldName.replace(/--/g, "/")}`;

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

// changes a json pointer /properties/field_name/properties/field_child to path $.field_name.field_child
export const jsonSchemaPointerToPath = (jsonPointer: string) => {
  const j = jsonPointerToPath(jsonPointer);
  return j.replace(/\.properties/g, "");
};

// borrowed from https://github.com/javi11/jpo-jpa
const jsonPointerToPath = (jsonPointer: string) => {
  const specialChars = /[\s~!@#$%^&*()+\-=[\]{};':"\\|,.<>/?]+/;

  const unescape = (str: string) => {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  };

  const parse = (jsonPointer: string) => {
    if (jsonPointer.charAt(0) !== "/") {
      throw new Error(`Invalid JSON pointer: ${jsonPointer}`);
    }
    return jsonPointer.substring(1).split("/").map(unescape);
  };

  if (jsonPointer === "") {
    return "$";
  }

  if (jsonPointer === "/") {
    return `$['']`;
  }

  const tokens = parse(jsonPointer);
  let jsonPath = "$";

  for (let i = 0; i < tokens.length; i += 1) {
    if (specialChars.test(tokens[i])) {
      jsonPath += `['${tokens[i]}']`;
    } else {
      jsonPath += `.${tokens[i]}`;
    }
  }

  return jsonPath;
};

export const getFieldConfig = ({
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
  const { definition, schema, type: fieldType } = uiFieldObject;
  let fieldSchema = {} as RJSFSchema;
  let fieldName = "";
  let htmlFieldName = "";
  let value = "" as string | number | object | undefined;
  let rawErrors: string[] | FormattedFormValidationWarning[] = [];

  if (fieldType === "multiField" && definition && Array.isArray(definition)) {
    fieldName = uiFieldObject.name ? uiFieldObject.name : "";
    if (!fieldName) {
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
    // this may not work with nested required fields
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
    fieldSchema = getFieldSchema({
      definition,
      schema,
      formSchema,
    }) as RJSFSchema;
    fieldName = getNameFromDef({ definition, schema });
    htmlFieldName = getFieldNameForHtml({ definition, schema });
    const formDataPath = getFieldPathFromHtml(htmlFieldName);
    value = getByPointer(formData, formDataPath) as string | number | undefined;

    const fieldType =
      typeof fieldSchema?.type === "string"
        ? fieldSchema.type
        : Array.isArray(fieldSchema?.type)
          ? (fieldSchema.type[0] ?? "")
          : "";

    rawErrors = getWarningsForField({
      errors,
      fieldName,
      definition,
      fieldType,
    });
  }

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
  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // TODO: move schema mutations to own function
  const disabled = fieldType === "null";
  let options = {};

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
  return {
    type,
    props: {
      id: htmlFieldName,
      key: htmlFieldName,
      disabled,
      required: requiredField,
      minLength: fieldSchema?.minLength,
      maxLength: fieldSchema?.maxLength,
      schema: fieldSchema,
      rawErrors,
      value,
      options,
    },
  };
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

const isBasicallyAnObject = (mightBeAnObject: unknown): boolean => {
  if (typeof mightBeAnObject === "boolean") {
    return false;
  }
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
// handles array values as well - will set an empty array if no items have data
export const pruneEmptyNestedFields = (structuredFormData: object): object => {
  return Object.entries(structuredFormData).reduce(
    (acc, [key, value]) => {
      if (Array.isArray(value)) {
        const pruned = value.reduce((prunedArray: unknown[], arrayItem) => {
          if (isBasicallyAnObject(arrayItem)) {
            // remove any empty stuff from the object array items
            const prunedItem = pruneEmptyNestedFields(arrayItem as object);
            // remove the entire item if it comes back empty
            if (!isEmptyField(prunedItem)) {
              prunedArray.push(prunedItem);
            }
          } else if (
            !isEmptyField(arrayItem) ||
            (!isBasicallyAnObject(arrayItem) && arrayItem !== undefined)
          ) {
            prunedArray.push(arrayItem);
          }
          return prunedArray;
        }, []);
        acc[key] = pruned;
        return acc;
      }
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

const removePropertyPaths = (path: unknown): string => {
  if (typeof path !== "string") return "";
  return path.replace(/properties\//g, "").replace(/^\//, "");
};

export const getKeyParentPath = (key: string, parentPath?: string) => {
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

export const isFieldRequired = (
  definition: string | string[] | undefined,
  requiredFields: string[],
): boolean => {
  if (!definition) return false;

  const defs = Array.isArray(definition) ? definition : [definition];

  return defs
    .map((def) => removePropertyPaths(def))
    .some((clean) => requiredFields.includes(clean));
};

// dereferences all def links so that all necessary property definitions
// can be found directly within the property without referencing $defs.
// also resolves "allOf" references within "properties" or "$defs" fields.
// not merging the entire schema because many schemas have top level
// "allOf" blocks that often contain "if"/"then" statements or other things
// that the mergeAllOf library can't handle out of the box, and we don't need
// to condense in any case
export const processFormSchema = async (
  formSchema: RJSFSchema,
): Promise<RJSFSchema> => {
  try {
    const dereferenced = await $Refparser.dereference(formSchema);
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

export const pointerToFieldName = (pointer: string): string => {
  return pointer.replace("$.", "").replace(/\./g, "--");
};

export function addPrintWidgetToFields(uiSchema: UiSchema): UiSchema {
  return uiSchema.map((item) => {
    if (item.type === "field") {
      if (
        item.widget &&
        (item.widget === "AttachmentArray" || item.widget === "Attachment")
      ) {
        return {
          ...item,
          widget: "PrintAttachment",
        };
      }
      return {
        ...item,
        widget: "Print",
      };
    } else if (item.type === "section") {
      return {
        ...item,
        children: addPrintWidgetToFields(item.children),
      };
    }
    return item;
  });
}
