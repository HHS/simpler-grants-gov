import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsSF424D: FormFillFieldDefinitions = {
  title: {
    testId: "title",
    type: "text",
    field: "Title",
  },
  applicant_organization: {
    testId: "applicant_organization",
    type: "text",
    field: "Applicant Organization",
  },
};

export const SF424D_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Assurances for Construction Programs (SF-424D)",
  fields: fieldDefinitionsSF424D,
} as const;
