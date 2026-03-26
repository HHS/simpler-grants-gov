import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

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
