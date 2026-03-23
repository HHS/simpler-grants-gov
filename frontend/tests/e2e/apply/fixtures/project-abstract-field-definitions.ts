import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Project Abstract" link/heading on the application page
export const PROJECT_ABSTRACT_FORM_MATCHER = "^Project Abstract$";

export const fieldDefinitionsProjectAbstract: FormFillFieldDefinitions = {
  attachment: {
    testId: "file-input-input",
    type: "file",
    field: "Project Abstract File",
  },
};

export const PROJECT_ABSTRACT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Project Abstract",
  fields: fieldDefinitionsProjectAbstract,
} as const;
