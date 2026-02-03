import { RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { JSONSchema7 } from "json-schema";
import mergeAllOf from "json-schema-merge-allof";
import { isArray, isObject } from "lodash";
import { extricateConditionalValidationRules } from "src/utils/applyForm/formSchemaProcessors";
import { isBasicallyAnObject } from "src/utils/generalUtils";

import { formDataToObject } from "./formDataToJson";
import {
  FormattedFormValidationWarning,
  FormValidationWarning,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UiSchemaSection,
} from "./types";

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
  title?: string | null,
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

// not used in multifield
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

/*
  Our backend provides schemas with $ref already resolved.

  On the frontend we still:
    1) strip / extract complex conditionals (if/then/else) for separate handling, and
    2) run mergeAllOf only on the 'properties' subtree to flatten *safe* 'allOf' usage.

  We intentionally do NOT merge the entire schema because allOf-merging across the full
  schema can interact badly with complex conditionals and other constructs we don’t need
  to condense for rendering/saving.
 */
export const processFormSchema = (
  formSchema: RJSFSchema,
): {
  formSchema: RJSFSchema;
  conditionalValidationRules: RJSFSchema;
} => {
  try {
    const { propertiesWithoutComplexConditionals, conditionalValidationRules } =
      extricateConditionalValidationRules(
        (formSchema.properties ?? {}) as JSONSchema7,
      );
    const condensedProperties = mergeAllOf({
      properties: propertiesWithoutComplexConditionals,
    } as JSONSchema7);
    return {
      formSchema: {
        ...formSchema,
        ...condensedProperties,
      },
      conditionalValidationRules,
    };
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

export const isMultifield = (uiFieldObject: UiSchemaField): boolean => {
  const { definition, type: uiSchemaFieldType } = uiFieldObject;
  if (
    uiSchemaFieldType === "multiField" &&
    definition &&
    Array.isArray(definition)
  ) {
    return true;
  }
  if (typeof definition === "string") {
    return false;
  }
  throw new Error(
    `non basic, non multifield field encountered: ${uiSchemaFieldType}`,
  );
};
