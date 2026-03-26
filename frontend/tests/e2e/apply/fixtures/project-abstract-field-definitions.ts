import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsProjectAbstract: FormFillFieldDefinitions = {
  attachment: {
    testId: "file-input-input",
    type: "file",
    field: "Project Abstract File",
  },
};

export const PROJECT_ABSTRACT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: /^Project Abstract$/, // regex exact match — won't match "Project Abstract Summary"
  fields: fieldDefinitionsProjectAbstract,
} as const;
