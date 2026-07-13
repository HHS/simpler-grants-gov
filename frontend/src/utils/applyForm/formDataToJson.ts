// based on https://github.com/ArturKot95/FormData2Json/blob/main/src/formDataToObject.ts

import { RJSFSchema } from "@rjsf/utils";
import { getByPointer, getFieldPathFromHtml } from "src/utils/formDataUtils";

// like, this is basically anything lol - DWS
type NestedObject = {
  [key: string]:
    | NestedObject
    | NestedObject[]
    | (object | string | boolean | number | null | undefined);
};

type FormDataToJsonOptions = {
  // seems to be unused, but an optional path prefix to add when referencing schema location
  parentKey?: string;
  // will default to `--` downstream if not provided. Used to convert representation of nested fields
  // from FormData / DOM level implementation to implementation used in schema
  delimiter?: string;
};

/*
  parses form data values (which based on FormData defs are either string or blob)
  into proper data types based on specified type from schema definition

  note:
  - string representations of booleans are cast to booleans
  - for number type fields, cast to number as long as a value is present
  - for string type fields that represent a number, ensure they remain strings (or undefined)
  - otherwise it may be an object or array, so try to cast to parse json
    - note that this will cast a number string ("1") to a number, thus the necessity of the previous case
  - if the json parse fails, just return the string (or undefined)
*/
const parseValue = (value: unknown, type: string) => {
  if (value === "false") return false;
  if (value === "true") return true;
  if (
    (type === "integer" || type === "number") &&
    value !== "" &&
    !isNaN(Number(value))
  )
    return Number(value);
  if (type === "string" && !isNaN(Number(value))) {
    return value || undefined;
  }
  try {
    return JSON.parse(value as string) as unknown;
  } catch (_e) {
    return value || undefined;
  }
};

// determines the proper type of a form field's value based on the form's schema
const getFieldType = (
  currentKey: string, // FormData key
  formSchema: RJSFSchema,
  options: FormDataToJsonOptions = {},
): string => {
  // for fields that represent array items in the form schema, we need to reference
  // the "items" property of the field's schema definition. The form data key will
  // include an index into the array - switching that out for "items" will allow us to
  // point to the correct place in the form schema.
  // needed to handle activity line items in the budget form
  const keyWithArrayNotationStripped = currentKey.replace(
    /\[\d+\]/g,
    "--items",
  );
  const path = getFieldPathFromHtml(
    keyWithArrayNotationStripped,
    options.delimiter,
  );
  const fullPath = options.parentKey ? `${options.parentKey}/${path}` : path;
  const formFieldDefinition = getByPointer(formSchema, fullPath) as {
    type?: string;
  };
  if (!formFieldDefinition?.type) {
    console.error("Undefined field type shaping form data", currentKey);
    return "string"; // I mean, like, we may as well take our best guess and cross our fingers
  }
  return formFieldDefinition?.type;
};

// basic functionality here was borrowed from https://github.com/ArturKot95/FormData2Json
// handles conversion of FormData into a POJO, accounting for nested structures and arrays
export function formDataToObject(
  formData = new FormData(),
  formSchema: RJSFSchema, // expects that any "/properties" path segments have already been removed
  options?: FormDataToJsonOptions,
): NestedObject {
  const delimiter = options?.delimiter || "--";
  const { parentKey } = options ?? { parentKey: "" };
  const result: NestedObject = {};
  const entries = formData.entries();

  for (const [key, value] of entries) {
    const currentKey = parentKey ? `${parentKey}${delimiter}${key}` : key;
    const chunks = currentKey.split(delimiter);
    const fieldType = getFieldType(currentKey, formSchema, options);
    const parsedValue = parseValue(value, fieldType);

    let current = result;

    const chunksLen = chunks.length;
    for (let chunkIdx = 0; chunkIdx < chunksLen; chunkIdx++) {
      const chunkName = chunks[chunkIdx];
      const isArray = chunkName.endsWith("]");

      if (isArray) {
        const indexStart = chunkName.indexOf("[");
        const indexEnd = chunkName.indexOf("]");

        const arrayIndex = parseInt(
          chunkName.substring(indexStart + 1, indexEnd),
        );

        if (isNaN(arrayIndex)) {
          throw new Error(
            `wrong form data - cannot retrieve array index ${arrayIndex}`,
          );
        }

        const actualChunkName = chunkName.substring(0, indexStart);
        current[actualChunkName] =
          current[actualChunkName] ?? ([] as unknown[]);

        const currentChunk = current[actualChunkName] as unknown[];
        if (chunkIdx === chunks.length - 1) {
          currentChunk[arrayIndex] = parsedValue;
        } else {
          // this is here to satisfy the TS, would love to find a way to remove this check
          if (Array.isArray(current[actualChunkName])) {
            current[actualChunkName][arrayIndex] =
              currentChunk[arrayIndex] ?? {};
            current = currentChunk[arrayIndex] as NestedObject;
          }
        }
      } else {
        if (chunkIdx === chunks.length - 1) {
          current[chunkName] = parsedValue as NestedObject;
        } else {
          current[chunkName] = current[chunkName] ?? {};
          current = current[chunkName] as NestedObject;
        }
      }
    }
  }

  return result;
}
