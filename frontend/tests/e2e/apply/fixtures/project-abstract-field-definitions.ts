import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
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

// Errors anchor to the visible file chooser (`attachment-visible`), not the hidden value
// input, so the alert link focuses the control the user acts on. The empty field is now
// genuinely absent rather than an empty File, so it reports as required.
export const PROJECT_ABSTRACT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachment-visible",
    message: "Project Abstract File is required",
  },
];
