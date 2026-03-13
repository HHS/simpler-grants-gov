import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsSF424B: FormFillFieldDefinitions = {
  title: {
    selector:
      'input[name*="title" i], input[placeholder*="title" i], textarea[name*="title" i], textarea[placeholder*="title" i]',
    type: "text",
    field: "Title",
  },
  organization: {
    selector: 'input[name*="applicant" i], input[name*="organization" i]',
    type: "text",
    field: "Organization",
  },
};

export const SF424B_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "SF-424B|Assurances for Non-Construction Programs",
  fields: fieldDefinitionsSF424B,
} as const;
