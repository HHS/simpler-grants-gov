import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Regex matcher tolerant of hyphen/dash variants for SF-424B,
// compatible with both local and staging environments.
export const SF424B_FORM_MATCHER =
  /SF\s*[-‑–—]?\s*424B|Assurances\s+for\s+Non\s*[-‑–—]?\s*Construction\s+Programs/i;

// Field ID mapping for API schema to test field IDs
export const SF424B_FIELD_ID_MAP: Record<string, string> = {
  "title": "title",
  "applicant_organization": "applicant_organization",
};

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
  formName: SF424B_FORM_MATCHER,
  fields: fieldDefinitionsSF424B,
} as const;

// Required field validation errors for SF-424B
export const SF424B_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "title", message: "Title is required" },
  {
    fieldId: "applicant_organization",
    message: "Applicant Organization is required",
  },
];
