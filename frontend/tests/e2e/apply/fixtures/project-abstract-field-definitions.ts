import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PROJECT_ABSTRACT_FORM_MATCHER =
  /Project\s+Abstract(?!\s+Summary)/i;

// Field ID mapping for API schema to test field IDs
export const PROJECT_ABSTRACT_FIELD_ID_MAP: Record<string, string> = {
  "project_abstract_file": "project_abstract_file",
};

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
    message: "{} is not of type string",
  },
];
