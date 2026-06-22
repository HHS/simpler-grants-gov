import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Matches the NEH Supplementary Cover Sheet link/heading on the application page
export const SUPP_COVER_SHEET_NEH_FORM_MATCHER =
  /Supplementary\s+Cover\s+Sheet\s+for\s+NEH\s+Grant\s+Programs/i;

// Field ID mapping for API schema to test field IDs
export const SUPP_COVER_SHEET_NEH_FIELD_ID_MAP: Record<string, string> = {
  "major_field": "major_field",
  "organization_type": "organization_type",
  "funding_group/outright_funds": "funding_group--outright_funds",
  "funding_group/matching_funds": "funding_group--matching_funds",
};

// Required field validation errors for failure-path tests
