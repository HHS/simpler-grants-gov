import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SF424D_FORM_MATCHER =
  /SF\s*[-‑–—]?\s*424D|Assurances\s+for\s+Construction\s+Programs/i;

// Field ID mapping for API schema to test field IDs
export const SF424D_FIELD_ID_MAP: Record<string, string> = {
  "title": "title",
  "applicant_organization": "applicant_organization",
};

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
  formName: SF424D_FORM_MATCHER,
  fields: fieldDefinitionsSF424D,
} as const;

// Required field validation errors for SF-424D
