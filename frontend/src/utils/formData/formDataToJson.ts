// based on https://github.com/ArturKot95/FormData2Json/blob/main/src/formDataToObject.ts

import { RJSFSchema } from "@rjsf/utils";
import {
  FORM_DATA_NESTING_DELIMITER,
  getByPointer,
  getFieldPathFromHtml,
  isNonSchemaFormDataKey,
} from "src/utils/formData/formDataUtils";

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
  // will default to the FORM_DATA_NESTING_DELIMITER (`--`) downstream if not provided. Used to convert representation of nested fields
  // from FormData / DOM level implementation to implementation used in schema
  delimiter?: string;
};

/*
  parses form data values (which based on FormData defs are either string or blob)
  into proper data types based on specified type from schema definition

  note:
  - string representations of booleans are cast to booleans
  - for number type fields, cast to number as long as a value is present
  - for string type fields that represent a number, ensure they remain strings (or undefined/null)
  - otherwise it may be an object or array, so try to cast to parse json
    - note that this will cast a number string ("1") to a number, thus the necessity of the previous case
  - if the json parse fails, just return the string (or undefined/null)
  - default undefined/null values are determined by the default value passed in the original formDataToObject call
    - apply form validations require `undefined` values for empty fields
    - all other forms should use `null`
*/
const parseValue = (
  value: unknown,
  type: string,
  defaultValue: null | undefined,
) => {
  if (value === "false") return false;
  if (value === "true") return true;
  if (
    (type === "integer" || type === "number") &&
    value !== "" &&
    !isNaN(Number(value))
  )
    return Number(value);
  if (type === "string" && !isNaN(Number(value))) {
    return value || defaultValue;
  }
  try {
    return JSON.parse(value as string) as unknown;
  } catch (_e) {
    return value || defaultValue;
  }
};

// determines the proper type of a form field's value based on the form's schema
const getFieldType = (
  currentKey: string, // FormData key
  formSchema: RJSFSchema,
  delimiter: string,
  parentKey: string,
): string => {
  // for fields that represent array items in the form schema, we need to reference
  // the "items" property of the field's schema definition. The form data key will
  // include an index into the array - switching that out for "items" will allow us to
  // point to the correct place in the form schema.
  // needed to handle activity line items in the budget form
  const keyWithArrayNotationStripped = currentKey.replace(
    /\[\d+\]/g,
    `${delimiter}items`,
  );
  const path = getFieldPathFromHtml(keyWithArrayNotationStripped, delimiter);
  const fullPath = parentKey ? `${parentKey}/${path}` : path;
  const formFieldDefinition = getByPointer(formSchema, fullPath) as {
    type?: string;
  };
  if (!formFieldDefinition?.type) {
    // control inputs are filtered out before we get here, so this is a schema backed field
    // whose value we are about to guess the type of
    console.error(
      "Undefined field type shaping form data - guessing string, submitted value may be the wrong type",
      { formDataKey: currentKey, schemaPath: fullPath },
    );
    return "string"; // I mean, like, we may as well take our best guess and cross our fingers
  }
  return formFieldDefinition?.type;
};

// basic functionality here was borrowed from https://github.com/ArturKot95/FormData2Json
// handles conversion of FormData into a POJO, accounting for nested structures and arrays
export function formDataToObject<T = NestedObject>(
  formData = new FormData(),
  formSchema: RJSFSchema, // expects that any "/properties" path segments have already been removed
  // apply form validations require `undefined` values for empty fields
  // all other forms should use `null`
  defaultValue: null | undefined,
  options?: FormDataToJsonOptions,
): T {
  const delimiter = options?.delimiter || FORM_DATA_NESTING_DELIMITER;
  const parentKey = options?.parentKey || "";
  const result: NestedObject = {};
  const entries = formData.entries();

  for (const [key, value] of entries) {
    // UI only control inputs carry no schema backed value, so they are skipped rather than
    // looked up (which would report a type mismatch) and rather than shaped into the output.
    // Checked against the input's own name rather than the parentKey prefixed path, since
    // whether something is a control input is a property of the input, not of where it sits
    if (isNonSchemaFormDataKey(key)) {
      continue;
    }
    const currentKey = parentKey ? `${parentKey}${delimiter}${key}` : key;
    const chunks = currentKey.split(delimiter);
    const fieldType = getFieldType(
      currentKey,
      formSchema,
      delimiter,
      parentKey,
    );
    const parsedValue = parseValue(value, fieldType, defaultValue);

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

  return result as T;
}
