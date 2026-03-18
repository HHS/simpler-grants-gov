import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsSF424B: FormFillFieldDefinitions = {
  title: {
    testId: "title",
    type: "text",
    field: "Title",
  },
  organization: {
    testId: "applicant_organization",
    type: "text",
    field: "Applicant Organization",
  },
};

export const SF424B_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Assurances for Non-Construction Programs (SF-424B)",
  fields: fieldDefinitionsSF424B,
} as const;
