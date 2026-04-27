import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Attachment Form" link/heading on the application page
export const ATTACHMENT_FORM_MATCHER = /^Attachment Form$/i;

export const fieldDefinitionsAttachment: FormFillFieldDefinitions = {
  att1: {
    selector: 'input[name="att1"][type="file"]',
    type: "file",
    field: "Attachment 1",
  },
};

export const ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: ATTACHMENT_FORM_MATCHER,
  fields: fieldDefinitionsAttachment,
} as const;
