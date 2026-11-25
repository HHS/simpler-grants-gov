import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

/**
 * For application attachments, the attachment field name is assoicated to
 * to a visible and hidden input. The visible input for virus scanning
 * is rendered, but the value of the form field lives on the hidden input.
 *
 * For example, if a form field has an attachment property "att1", there
 * will be a hidden input with `name` and `id` property of "att1" and a
 * visible file input of "att1-visible"
 */
export const fieldDefinitionsAttachment: FormFillFieldDefinitions = {
  att1: {
    selector: 'input[name="att1-visible"][type="file"]',
    type: "file",
    field: "Attachment 1",
  },
};

export const ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Attachment Form",
  fields: fieldDefinitionsAttachment,
} as const;

export const ATTACHMENT_GENERATED_FORM_CONFIG = {
  ...ATTACHMENT_FORM_CONFIG,
  formName: "Attachments",
  fields: {
    att1: {
      ...ATTACHMENT_FORM_CONFIG.fields.att1,
      field: "1) Please attach Attachment 1",
    },
  },
} as const;
