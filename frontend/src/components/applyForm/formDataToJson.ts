// based on https://github.com/ArturKot95/FormData2Json/blob/main/src/formDataToObject.ts

import { RJSFSchema } from "@rjsf/utils";

import { getByPointer, getFieldPath } from "./utils";

// like, this is basically anything lol - DWS
type NestedObject = {
  [key: string]:
    | NestedObject
    | NestedObject[]
    | (object | string | boolean | number | null | undefined);
};

type FormDataToJsonOptions = {
  parentKey?: string;
  delimiter?: string;
};

/*
  - Empty strings ("") are preserved only if the schema type is "string";
    otherwise they become "undefined".
  - "true"/"false" are cast to booleans.
  - Numeric strings are cast to numbers *only* if the schema type is "number" or "integer".
  - String fields always remain strings, even if the content looks numeric
    (to avoid breaking things like IDs or codes).
  - For schema types "object" or "array", values that look like JSON
    (starting with {, [) are parsed via JSON.parse.
  - For all other cases, the raw string is returned.
*/
const parseValue = (rawValue: unknown, type: string) => {
  const text = String(rawValue).trim();

  // Empty
  if (text === "") return type === "string" ? "" : undefined;

  // Booleans
  if (text === "true") return true;
  if (text === "false") return false;

  // Numbers
  if ((type === "number" || type === "integer") && !isNaN(Number(text))) {
    return Number(text);
  }

  // String
  if (type === "string") {
    return text;
  }

  // Object/Array
  const looksJsonish = text.startsWith("{") || text.startsWith("[");
  if ((type === "object" || type === "array") && looksJsonish) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }


  if (looksJsonish) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      console.error("Not valid json")
    }
  }

  return text;
};

const getFieldType = (
  currentKey: string,
  formSchema: RJSFSchema,
  parentKey?: string,
): string => {
  const path = getFieldPath(currentKey);
  const fullPath = parentKey ? `${parentKey}/${path}` : path;
  const formFieldDefinition = getByPointer(formSchema, fullPath) as {
    type?: string;
  };
  return formFieldDefinition?.type || "";
};

export function formDataToObject(
  formData = new FormData(),
  formSchema: RJSFSchema,
  options?: FormDataToJsonOptions,
): NestedObject {
  const delimiter = options?.delimiter || ".";
  const { parentKey } = options ?? { parentKey: "" };
  const result: NestedObject = {};
  const entries = formData.entries();

  for (const [key, value] of entries) {
    const currentKey = parentKey ? `${parentKey}${delimiter}${key}` : key;
    const chunks = currentKey.split(delimiter);
    const fieldType = getFieldType(currentKey, formSchema, parentKey);
    const parsedValue = parseValue(value, fieldType);

    let current: NestedObject = result;

    const chunksLength = chunks.length;
    for (let chunkIndex = 0; chunkIndex < chunksLength; chunkIndex++) {
      const chunkName = chunks[chunkIndex];
      const isArrayKey = chunkName.endsWith("]");

      if (isArrayKey) {
        const indexStart = chunkName.indexOf("[");
        const indexEnd = chunkName.indexOf("]");
        const arrayIndex = parseInt(
          chunkName.substring(indexStart + 1, indexEnd),
        );

        if (isNaN(arrayIndex)) {
          throw new Error(
            `Invalid form data - cannot retrieve array index: ${arrayIndex}`,
          );
        }

        const propertyName = chunkName.substring(0, indexStart);
        current[propertyName] =
          (current[propertyName] as unknown[]) ?? ([] as unknown[]);

        const currentArray = current[propertyName] as unknown[];
        if (chunkIndex === chunksLength - 1) {
          currentArray[arrayIndex] = parsedValue;
        } else {
          if (Array.isArray(current[propertyName])) {
            current[propertyName][arrayIndex] = currentArray[arrayIndex] ?? {};
            current = currentArray[arrayIndex] as NestedObject;
          }
        }
      } else {
        if (chunkIndex === chunksLength - 1) {
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
