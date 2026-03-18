import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Uses regex matcher tolerant of hyphen/dash variants for SF-424B, to be compatible with both local and staging.
export const SF424B_FORM_MATCHER =
  "SF\\s*[-‑–—]?\\s*424B|Assurances\\s+for\\s+Non\\s*[-‑–—]?\\s*Construction\\s+Programs";

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
