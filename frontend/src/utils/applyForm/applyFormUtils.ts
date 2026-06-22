import { RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { JSONSchema7 } from "json-schema";
import mergeAllOf from "json-schema-merge-allof";
import { isObject } from "lodash";
import {
  FormattedFormValidationWarning,
  FormValidationWarning,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UiSchemaNode,
} from "src/types/applyForm/types";
import { extricateConditionalValidationRules } from "src/utils/applyForm/formSchemaProcessors";
import { isBasicallyAnObject } from "src/utils/generalUtils";

import { formDataToObject } from "./formDataToJson";

const nestedWarningsForField = ({
  definition,
  errors,
  fieldName,
  fieldSchema,
  formSchema,
  path,
  uiSchema,
}: {
  definition: string;
  errors: FormValidationWarning[];
  fieldName: string;
  fieldSchema: SchemaField;
  formSchema: RJSFSchema;
  path: string;
  uiSchema: UiSchema;
}): FormattedFormValidationWarning[] => {
  const parent = definition.replace(/\/properties\/\w+$/, "");
  const parentFieldDefinition = getFieldSchema({
    definition: parent,
    formSchema,
    schema: undefined,
  });

  if (!parentFieldDefinition) {
    return [];
  }

  const matchingErrors = errors.filter(({ field }) => {
    if (
      path.includes(field) &&
      path !== field &&
      "required" in parentFieldDefinition &&
      parentFieldDefinition.required?.indexOf(fieldName) !== -1
    ) {
      return true;
    }
    return false;
  });

  if (matchingErrors.length < 1) {
    return [];
  }

  return matchingErrors.map((error) => {
    const fieldListLabel = getFieldListLabelFromDefinition({
      definition,
      uiSchema,
    });
    const message = error.message.replace(/'\S+'/, fieldName);
    const formatted = formatValidationWarning(fieldName, message, fieldSchema);
    const formattedWithParent = parentFieldDefinition.title
      ? `${parentFieldDefinition.title} ${formatted}`
      : formatted;
    const htmlField = getHtmlFieldForWarning({
      definition,
      field: error.field,
      schema: fieldSchema,
    });
    return {
      ...error,
      formatted: formattedWithParent,
      htmlField,
      definition,
      fieldListLabel,
    };
  });
};

// formats warning messages for more helpful display
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
export const formatValidationWarning = (
  fieldName: string,
  message: string,
  fieldSchema?: SchemaField,
): string => {
  return validationWarningOverrides(message, fieldName, fieldSchema?.title);
};
export const findValidationErrors = (
  errors: FormValidationWarning[],
  definition: string | undefined,
  schema: SchemaField | undefined,
  formSchema: RJSFSchema,
  uiSchema: UiSchema,
): FormattedFormValidationWarning[] => {
  const fieldSchema = getFieldSchema({
    definition,
    formSchema,
    schema,
  }) as SchemaField;
  const path = definition ? jsonSchemaPointerToPath(definition) : "";
  const fieldName = definition
    ? definition.split("/")[definition.split("/").length - 1]
    : "";
  const directWarnings = errors.filter((error) => {
    if (error.field === path) {
      return true;
    }
    const fieldListMatch = definition?.match(
      /^\/properties\/([^/]+)\/items\/properties\/(.+)$/,
    );

    if (!fieldListMatch) {
      return false;
    }
    const [, fieldListName, childDefinitionPath] = fieldListMatch;
    const childFieldPath = childDefinitionPath.replace(/\/properties\//g, ".");
    return new RegExp(
      `^\\$\\.${fieldListName}\\[(\\d+)\\]\\.${childFieldPath}$`,
    ).test(error.field);
  });

  if (directWarnings.length > 0) {
    return directWarnings.map((directWarning) => {
      const fieldListLabel = getFieldListLabelFromDefinition({
        definition,
        uiSchema,
      });
      const formatted = formatValidationWarning(
        fieldName,
        directWarning.message,
        fieldSchema,
      );
      const htmlField = getHtmlFieldForWarning({
        definition,
        field: directWarning.field,
        schema: fieldSchema,
      });

      return {
        ...directWarning,
        formatted,
        htmlField,
        definition,
        fieldListLabel,
      };
    });
  }
  if (fieldSchema && definition) {
    return nestedWarningsForField({
      path,
      definition,
      fieldName,
      errors,
      fieldSchema,
      formSchema,
      uiSchema,
    });
  }
  return [];
};

export const buildWarningTree = (
  uiSchema: UiSchema | UiSchemaField[] | UiSchemaNode,
  parent: UiSchema | UiSchemaField[] | UiSchemaNode | null,
  formValidationWarnings: FormValidationWarning[],
  formSchema: RJSFSchema,
  rootUiSchema?: UiSchema,
): FormattedFormValidationWarning[] => {
  const resolvedRootUiSchema =
    rootUiSchema ?? (Array.isArray(uiSchema) ? uiSchema : []);
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
      resolvedRootUiSchema,
    );
  } else if (Array.isArray(uiSchema)) {
    const childErrors = uiSchema.reduce<FormattedFormValidationWarning[]>(
      (errors, node) => {
        if ("children" in node) {
          const children = node.children;
          const nodeError = buildWarningTree(
            children,
            uiSchema,
            formValidationWarnings,
            formSchema,
            resolvedRootUiSchema,
          );
          return errors.concat(nodeError);
        } else if (!parent && ("definition" in node || "schema" in node)) {
          const matchingWarnings = findValidationErrors(
            formValidationWarnings,
            Array.isArray(node.definition)
              ? node.definition[0]
              : node.definition,
            node.schema,
            formSchema,
            resolvedRootUiSchema,
          );
          if (matchingWarnings.length > 0) {
            return errors.concat(matchingWarnings);
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
              resolvedRootUiSchema,
            );
            return errors.concat(nodeError);
          } else {
            const matchingWarnings = findValidationErrors(
              formValidationWarnings,
              Array.isArray(node.definition)
                ? node.definition[0]
                : node.definition,
              node.schema,
              formSchema,
              resolvedRootUiSchema,
            );
            if (matchingWarnings.length > 0) {
              return errors.concat(matchingWarnings);
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
export function getHtmlFieldForWarning({
  definition,
  field,
  schema,
}: {
  definition?: string;
  field?: string;
  schema?: SchemaField;
}): string | undefined {
  const match = definition
    ? definition.match(/^\/properties\/([^/]+)\/items\/properties\/(.+)$/)
    : null;

  if (!match) {
    return getFieldNameForHtml({
      definition,
      schema,
    });
  }

  const [, fieldListName, childDefinitionPath] = match;
  const childFieldPath = childDefinitionPath.replace(/\/properties\//g, ".");
  const childHtmlPath = childFieldPath.replace(/\./g, "--");

  const entryMatch = field?.match(
    new RegExp(`^\\$\\.${fieldListName}\\[(\\d+)\\]\\.${childFieldPath}$`),
  );

  if (entryMatch) {
    const [, entryIndex] = entryMatch;
    return `${fieldListName}[${entryIndex}]--${childHtmlPath}`;
  }

  return `${fieldListName}[0]--${childHtmlPath}`;
}

// Finds the parent FieldList label for a child field definition so it can be
// used in summary text like "First Name is required (Contact People, Entry 2)".
export function getFieldListLabelFromDefinition({
  definition,
  uiSchema,
}: {
  definition?: string;
  uiSchema: UiSchema;
}): string | undefined {
  if (!definition) {
    return undefined;
  }

  const match = definition.match(
    /^\/properties\/([^/]+)\/items\/properties\/.+$/,
  );

  if (!match) {
    return undefined;
  }

  const [, fieldListName] = match;

  const findFieldListLabel = (nodes: UiSchema): string | undefined => {
    for (const node of nodes) {
      if (node.type === "fieldList" && node.name === fieldListName) {
        return node.label;
      }

      if ("children" in node && Array.isArray(node.children)) {
        const nestedLabel = findFieldListLabel(node.children as UiSchema);
        if (nestedLabel) {
          return nestedLabel;
        }
      }
    }

    return undefined;
  };

  return findFieldListLabel(uiSchema);
}

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
      if (Array.isArray(item.children)) {
        results.push(
          ...getFieldsForNav(
            item.children.filter(
              (child) => child.type === "section",
            ) as unknown as UiSchema,
          ),
        );
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

const getObjectItemSchema = (schema?: RJSFSchema): RJSFSchema | undefined => {
  if (
    schema?.items &&
    !Array.isArray(schema.items) &&
    typeof schema.items === "object"
  ) {
    return schema.items as RJSFSchema;
  }

  return undefined;
};

const shouldPreserveEmptyNestedObject = ({
  key,
  parentSchema,
}: {
  key: string;
  parentSchema?: RJSFSchema;
}): boolean => {
  return Boolean(parentSchema?.required?.includes(key));
};

/**
 * Returns the schema for a child field from either the original schema shape
 * or the condensed schema shape.
 *
 * Some callers pass a standard JSON schema where child fields live under
 * `properties`. Other callers pass the condensed form schema used by
 * `formDataToObject`, where child fields are flattened to the current level.
 */
const getChildSchema = ({
  schema,
  key,
}: {
  schema?: RJSFSchema;
  key: string;
}): RJSFSchema | undefined => {
  return (schema?.properties?.[key] ??
    (schema as Record<string, unknown> | undefined)?.[key]) as
    | RJSFSchema
    | undefined;
};

/**
 * Removes empty nested values from shaped form data before save.
 *
 * Empty values are usually pruned so we do not persist empty nested objects
 * created by the form renderer. FieldList arrays are the exception: when an
 * array schema defines `minItems`, empty entry objects up to that minimum must be
 * preserved so validation can report entry-level required-field errors instead of
 * array-level "too short" errors.
 *
 * Example:
 *   minItems: 2
 *   [{ first_name: "Jane" }, {}]
 *
 * should remain:
 *   [{ first_name: "Jane" }, {}]
 *
 * while extra empty entry beyond `minItems` can still be pruned.
 */
export const pruneEmptyNestedFields = (
  structuredFormData: object | undefined | null,
  schema?: RJSFSchema,
): object => {
  if (!structuredFormData || typeof structuredFormData !== "object") {
    return {};
  }

  return Object.entries(structuredFormData).reduce(
    (acc, [key, value]) => {
      const fieldSchema = getChildSchema({ schema, key });

      if (Array.isArray(value)) {
        const minimumItems =
          typeof fieldSchema?.minItems === "number" ? fieldSchema.minItems : 0;

        const itemSchema = getObjectItemSchema(fieldSchema);

        const isObjectArray = Boolean(
          itemSchema && itemSchema.type === "object",
        );

        const pruned = value.reduce(
          (prunedArray: unknown[], arrayItem, index) => {
            if (isBasicallyAnObject(arrayItem)) {
              const prunedItem = pruneEmptyNestedFields(
                arrayItem as object,
                itemSchema,
              );

              if (
                !isEmptyField(prunedItem) ||
                index < minimumItems ||
                isObjectArray
              ) {
                prunedArray.push(prunedItem);
              }

              return prunedArray;
            }

            if (arrayItem !== undefined && arrayItem !== null) {
              prunedArray.push(arrayItem);
            }
            return prunedArray;
          },
          [],
        );
        acc[key] = pruned;
        return acc;
      }
      if (value === undefined || value === null) {
        return acc;
      }
      if (!isBasicallyAnObject(value)) {
        acc[key] = value;
        return acc;
      }

      const pruned = pruneEmptyNestedFields(value as object, fieldSchema);
      if (isEmptyField(pruned)) {
        if (
          shouldPreserveEmptyNestedObject({
            key,
            parentSchema: schema,
          })
        ) {
          acc[key] = {};
        }

        return acc;
      }

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
  return pruneEmptyNestedFields(
    structuredFormData,
    condenseFormSchemaProperties(formSchema) as RJSFSchema,
  ) as T;
};

const removePropertyPaths = (path: unknown): string => {
  if (typeof path !== "string") {
    return "";
  }

  return path
    .replace(/properties\//g, "")
    .replace(/items\//g, "")
    .replace(/^\//, "");
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
      if (isObject(value) && !Array.isArray(value)) {
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
    } else if (item.type === "fieldList") {
      return {
        ...item,
        children: item.children.map((child) => {
          // fieldList children should only be `field` nodes (validated by validateUiSchema).
          // This guard prevents us from applying print widget logic to unexpected node
          // types if an invalid schema slips through.
          if (child.type !== "field") {
            return child;
          }

          if (
            child.widget &&
            (child.widget === "AttachmentArray" ||
              child.widget === "Attachment")
          ) {
            return { ...child, widget: "PrintAttachment" };
          }

          return { ...child, widget: "Print" };
        }),
      };
    }
    return item;
  });
}
