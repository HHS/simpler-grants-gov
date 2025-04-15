import { RJSFSchema } from "@rjsf/utils";
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import { UiSchema } from "./types";
import { formSchemaValidate } from "./validations";

export const validateFormSchema = (data: RJSFSchema) => {
  return formSchemaValidate.parse(data);
};

export const validateUiSchema = (_data: UiSchema) => {
  return true;
};

function getKeysWithValues(formData: FormData) {
  const keysWithValue: { [key: string]: string } = {};
  for (const [key, value] of formData.entries()) {
    if (value && typeof value === "string") {
      keysWithValue[key] = value;
    }
  }
  return keysWithValue;
}

export const validateFormData = (
  formData: FormData,
  schema: RJSFSchema,
):
  | ErrorObject<string, Record<string, unknown>, unknown>[]
  | null
  | false
  | undefined
  | [] => {
  const data = getKeysWithValues(formData);
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (validate(data)) {
    return false;
  } else {
    return validate.errors;
  }
};
