import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PROJECT_ABSTRACT_FORM_MATCHER =
  /Project\s+Abstract(?!\s+Summary)/i;

export const fieldDefinitionsProjectAbstract: FormFillFieldDefinitions = {
  attachment: {
    testId: "file-input-input",
    type: "file",
    field: "Project Abstract File",
  },
};

export const PROJECT_ABSTRACT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: PROJECT_ABSTRACT_FORM_MATCHER, // regex exact match — won't match "Project Abstract Summary"
  fields: fieldDefinitionsProjectAbstract,
} as const;

// Required field validation errors for Project Abstract form
export const PROJECT_ABSTRACT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachment",
    message: "Project Abstract File is required",
  },
];
