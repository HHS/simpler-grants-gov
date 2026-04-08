import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Regex matcher tolerant of hyphen/dash variants for the NEH Supplementary Cover Sheet,
// compatible with both local and staging environments.
export const SUPP_COVER_SHEET_NEH_FORM_MATCHER =
  "Supplementary\\s+Cover\\s+Sheet\\s+for\\s+NEH\\s+Grant\\s+Programs";

// Required field validation errors for failure-path tests
export const SUPP_COVER_SHEET_NEH_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "major_field", message: "Major Field of Study is required" },
  { fieldId: "organization_type", message: "Type is required" },
  {
    fieldId: "funding_group--outright_funds",
    message: "Outright Funds is required",
  },
  {
    fieldId: "funding_group--federal_match",
    message: "Federal Match is required",
  },
  {
    fieldId: "application_info--additional_funding",
    message: "Additional Funding is required",
  },
  {
    fieldId: "application_info--application_type",
    message: "Type of Application is required",
  },
  {
    fieldId: "primary_project_discipline",
    message: "Primary Project Discipline is required",
  },
];
