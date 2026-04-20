import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const CD511_FORM_MATCHER = "CD511";

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

export const CD511_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "applicant_name", message: "Name of Applicant is required" },
  { fieldId: "award_number", message: "Award Number is required" },
  { fieldId: "project_name", message: "Project Name is required" },
  {
    fieldId: "contact_person--first_name",
    message: "Contact Person First Name is required",
  },
  {
    fieldId: "contact_person--last_name",
    message: "Contact Person Last Name is required",
  },
  { fieldId: "contact_person_title", message: "Title is required" },
];
