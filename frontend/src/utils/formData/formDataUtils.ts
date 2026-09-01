import { get as getSchemaObjectFromPointer } from "json-pointer";
import { escapeRegExpString } from "src/utils/generalUtils";

// when constructing field identifiers within the dom we will use hyphens rather than slashes
// since that will cause less confusion for html attributes and will have less conflict with other characters
export const FORM_DATA_NESTING_DELIMITER = "--";

export const JSON_SCHEMA_NESTING_DELIMITER = "/";

// API side validation library delimits nesting with a dot rather than a slash
export const VALIDATION_ERROR_NESTING_DELIMITER = ".";

// transform a form data field name / id into a json path that can be used to reference the form schema
// (assumes that any `/properties` path segments have been removed from schema)
export const getFieldPathFromHtml = (
  inputPath: string,
  inputDelimiter = FORM_DATA_NESTING_DELIMITER,
) =>
  `/${inputPath.replace(new RegExp(`${escapeRegExpString(inputDelimiter)}`, "g"), JSON_SCHEMA_NESTING_DELIMITER)}`;

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
