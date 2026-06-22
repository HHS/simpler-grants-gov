import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

// Matches "Attachment Form" link/heading on the application page
export const ATTACHMENT_FORM_MATCHER = /^Attachment Form$/i;

// Field ID mapping for API schema to test field IDs
export const ATTACHMENT_FIELD_ID_MAP: Record<string, string> = {
  "att1": "att1",
};

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
