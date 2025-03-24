import { FormSchema, UiSchema } from "./types";
import { formSchemaValidate, uiSchemaValidate } from "./validations";

export const validateFormSchema = (data: FormSchema) => {
    return formSchemaValidate.parse(data);
}

export const validateUiSchema = (data: UiSchema) => {
    return uiSchemaValidate.parse(data);
}