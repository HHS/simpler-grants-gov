import { get as getSchemaObjectFromPointer } from "json-pointer";
import { escapeRegExpString } from "src/utils/generalUtils";

// when constructing field identifiers within the dom we will use hyphens rather than slashes
// since that will cause less confusion for html attributes and will have less conflict with other characters
export const FORM_DATA_NESTING_DELIMITER = "--";

export const JSON_SCHEMA_NESTING_DELIMITER = "/";

// API side validation library delimits nesting with a dot rather than a slash
export const VALIDATION_ERROR_NESTING_DELIMITER = ".";

/*
  suffix for the user facing file chooser that attachment widgets render alongside the hidden
  input holding the schema backed value
*/
export const VISIBLE_FILE_INPUT_SUFFIX = "-visible";

const SERVER_ACTION_KEY_PREFIX = "$ACTION";

/*
  FormData keys belonging to inputs that drive the UI or the submission itself rather than
  carrying a value defined in a form schema. Each of these is read by name by the code that
  needs it, so none of them has a schema definition
*/
const NON_SCHEMA_FORM_DATA_KEYS = new Set([
  // which submit button was clicked, read in the opportunity edit and competition actions
  "submitType",
  // the apply form's submit button
  "apply-form-button",
  // the opportunity attachment chooser, plus the held / marked for deletion ids it carries
  // through to the next save
  "opportunity-attachment-upload",
  "held_pending_file_ids",
  "deleted_attachment_ids",
]);

/*
  Identifies keys that should not be looked up against a form schema
*/
export const isNonSchemaFormDataKey = (key: string): boolean =>
  NON_SCHEMA_FORM_DATA_KEYS.has(key) ||
  key.endsWith(VISIBLE_FILE_INPUT_SUFFIX) ||
  key.startsWith(SERVER_ACTION_KEY_PREFIX);

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
