import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Regex matcher tolerant of hyphen/dash variants for SF-424B,
// compatible with both local and staging environments.
export const SF424B_FORM_MATCHER =
  /SF\s*[-‑–-]?\s*424B|Assurances\s+for\s+Non\s*[-‑–-]?\s*Construction\s+Programs/i;

// maxLength values sourced from:
// api/src/form_schema/forms/sf424b/1/1/form_json.py
// api/src/form_schema/shared/common_shared.py
export const fieldDefinitionsSF424B: FormFillFieldDefinitions = {
  title: {
    testId: "title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title (title -> contact_person_title ref)
    section: "Signature",
    field: "Title",
  },
  applicant_organization: {
    testId: "applicant_organization",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Signature",
    field: "Applicant Organization",
  },
  // Not user-entered: type "null" in FORM_UI_SCHEMA, populated via
  // gg_post_population rules ("signature", "current_date") at submission time.
  signature: {
    printTestId: "signature",
    type: "text",
    section: "Signature",
    field: "Signature of the Authorized Certifying Official",
  },
  date_signed: {
    printTestId: "date_signed",
    type: "text",
    section: "Signature",
    field: "Date Signed",
  },
};

export const SF424B_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Assurances for Non-Construction Programs (SF-424B)",
  fields: fieldDefinitionsSF424B,
} as const;

// Required field validation errors for SF-424B
// (form_json.py: required = ["title", "applicant_organization"])
export const SF424B_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "title", message: "Title is required" },
  {
    fieldId: "applicant_organization",
    message: "Applicant Organization is required",
  },
];
