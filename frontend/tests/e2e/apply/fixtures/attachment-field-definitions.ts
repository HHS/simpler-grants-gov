import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const fieldDefinitionsAttachment: FormFillFieldDefinitions = {
  att1: {
    selector: 'input[name="att1"][type="file"]',
    type: "file",
    field: "Attachment 1",
  },
};

export const ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Attachment Form",
  fields: fieldDefinitionsAttachment,
} as const;
