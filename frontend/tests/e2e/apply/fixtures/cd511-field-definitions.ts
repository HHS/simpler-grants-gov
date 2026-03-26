import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsCD511: FormFillFieldDefinitions = {
  applicant_name: {
    testId: "applicant_name",
    type: "text",
    field: "Applicant Name",
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
