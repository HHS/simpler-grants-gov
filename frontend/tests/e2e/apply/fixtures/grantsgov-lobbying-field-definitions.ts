import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Regex matcher for the Grants.gov Lobbying Form link in the forms table.
export const GRANTSGOV_LOBBYING_FORM_MATCHER = "Grants\\.gov Lobbying Form";

export const fieldDefinitionsGrantsGovLobbying: FormFillFieldDefinitions = {
  organization_name: {
    testId: "organization_name",
    type: "text",
    field: "Organization Name",
  },
  authorized_representative_name_prefix: {
    testId: "authorized_representative_name--prefix",
    type: "text",
    field: "Authorized Representative Prefix",
  },
  authorized_representative_name_first_name: {
    testId: "authorized_representative_name--first_name",
    type: "text",
    field: "Authorized Representative First Name",
  },
  authorized_representative_name_middle_name: {
    testId: "authorized_representative_name--middle_name",
    type: "text",
    field: "Authorized Representative Middle Name",
  },
  authorized_representative_name_last_name: {
    testId: "authorized_representative_name--last_name",
    type: "text",
    field: "Authorized Representative Last Name",
  },
  authorized_representative_name_suffix: {
    testId: "authorized_representative_name--suffix",
    type: "text",
    field: "Authorized Representative Suffix",
  },
  authorized_representative_title: {
    testId: "authorized_representative_title",
    type: "text",
    field: "Authorized Representative Title",
  },
};

export const GRANTSGOV_LOBBYING_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Grants.gov Lobbying Form",
  fields: fieldDefinitionsGrantsGovLobbying,
} as const;

// Required field validation errors for Grants.gov Lobbying Form
export const GRANTSGOV_LOBBYING_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "organization_name",
    message: "Applicants Organization is required",
  },
  {
    fieldId: "authorized_representative_name--first_name",
    message: "Name and Contact Information First Name is required",
  },
  {
    fieldId: "authorized_representative_name--last_name",
    message: "Name and Contact Information Last Name is required",
  },
  {
    fieldId: "authorized_representative_title",
    message: "Title is required",
  },
];
