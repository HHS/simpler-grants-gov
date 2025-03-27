import { RJSFSchema } from "@rjsf/utils";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { UiSchema } from "./types";
import { formSchemaValidate, uiSchemaValidate } from "./validations";

export const validateFormSchema = (data: RJSFSchema) => {
  return formSchemaValidate.parse(data);
};

export const validateUiSchema = (data: UiSchema) => {
  return uiSchemaValidate.parse(data);
};

export const validateData = (data: object, schema: RJSFSchema) => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (validate(data)) {
    return false;
  } else {
    return validate.errors;
  }
};
