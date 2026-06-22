import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const CD511_FORM_MATCHER = "CD511";

// Field ID mapping for API schema to test field IDs
export const CD511_FIELD_ID_MAP: Record<string, string> = {
  "applicant_name": "applicant_name",
  "award_number": "award_number",
  "project_name": "project_name",
  "contact_person/first_name": "contact_person--first_name",
  "contact_person/last_name": "contact_person--last_name",
  "contact_person_title": "contact_person_title",
};

export const fieldDefinitionsCD511: FormFillFieldDefinitions = {
  applicant_name: {
    testId: "applicant_name",
    type: "text",
    field: "Applicant Name",
  },
  award_number: {
    testId: "award_number",
    type: "text",
    field: "Award Number",
  },
  project_name: {
    testId: "project_name",
    type: "text",
    field: "Project Name",
  },
  contact_person_prefix: {
    testId: "contact_person--prefix",
    type: "text",
    field: "Contact Person Prefix",
  },
  contact_person_first_name: {
    testId: "contact_person--first_name",
    type: "text",
    field: "Contact Person First Name",
  },
  contact_person_middle_name: {
    testId: "contact_person--middle_name",
    type: "text",
    field: "Contact Person Middle Name",
  },
  contact_person_last_name: {
    testId: "contact_person--last_name",
    type: "text",
    field: "Contact Person Last Name",
  },
  contact_person_suffix: {
    testId: "contact_person--suffix",
    type: "text",
    field: "Contact Person Suffix",
  },
  contact_person_title: {
    testId: "contact_person_title",
    type: "text",
    field: "Contact Person Title",
  },
};

export const CD511_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "CD511",
  fields: fieldDefinitionsCD511,
} as const;

