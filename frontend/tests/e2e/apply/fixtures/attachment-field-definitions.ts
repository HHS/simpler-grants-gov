import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Attachment Form" link/heading on the application page
export const ATTACHMENT_FORM_MATCHER = "^Attachment Form$";

export const fieldDefinitionsAttachment: FormFillFieldDefinitions = {
  att1: {
    testId: "file-input-input",
    type: "file",
    field: "Attachment 1",
  },
};

export const ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Attachment Form",
  fields: fieldDefinitionsAttachment,
} as const;
