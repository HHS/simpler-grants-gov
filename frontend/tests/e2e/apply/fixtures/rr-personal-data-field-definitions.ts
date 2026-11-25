import type { FillFormConfig } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const RR_PERSONAL_DATA_FORM_MATCHER =
  /Research & Related Personal Data/i;

export const RR_PERSONAL_DATA_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: RR_PERSONAL_DATA_FORM_MATCHER,
  fields: {
    firstName: {
      testId: "project_director--name--first_name",
      type: "text",
      field: "First Name",
    },
    lastName: {
      testId: "project_director--name--last_name",
      type: "text",
      field: "Last Name",
    },
  },
} satisfies FillFormConfig;

export const RR_PERSONAL_DATA_REQUIRED_FIELD_ERRORS = [
  {
    fieldId: "project_director--name--first_name",
    message: "Name First Name is required",
  },
  {
    fieldId: "project_director--name--last_name",
    message: "Name Last Name is required",
  },
];
