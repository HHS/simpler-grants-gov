import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Plain string matcher for the Grants.gov Lobbying Form link in the forms table.
// buildFlexibleFormNameRegex will escape the dot - do NOT pre-escape here.
export const GRANTSGOV_LOBBYING_FORM_MATCHER = "Grants.gov Lobbying Form";

// maxLength values sourced from:
// api/src/form_schema/forms/gg_lobbying_form/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py
export const fieldDefinitionsGrantsGovLobbying: FormFillFieldDefinitions = {
  // ********* Section 2 - Applicant's Organization *********
  organization_name: {
    testId: "organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Applicant's Organization",
    field: "Organization Name",
  },
  // ********* Section 3 - Authorized Representative *********
  authorized_representative_name_prefix: {
    testId: "authorized_representative_name--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Authorized Representative",
    field: "Authorized Representative Prefix",
  },
  authorized_representative_name_first_name: {
    testId: "authorized_representative_name--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Authorized Representative",
    field: "Authorized Representative First Name",
  },
  authorized_representative_name_middle_name: {
    testId: "authorized_representative_name--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Authorized Representative",
    field: "Authorized Representative Middle Name",
  },
  authorized_representative_name_last_name: {
    testId: "authorized_representative_name--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Authorized Representative",
    field: "Authorized Representative Last Name",
  },
  authorized_representative_name_suffix: {
    testId: "authorized_representative_name--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Authorized Representative",
    field: "Authorized Representative Suffix",
  },
  authorized_representative_title: {
    testId: "authorized_representative_title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title
    section: "Authorized Representative",
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
    message: "First Name is required",
  },
  {
    fieldId: "authorized_representative_name--last_name",
    message: "Last Name is required",
  },
  {
    fieldId: "authorized_representative_title",
    message: "Title is required",
  },
];
