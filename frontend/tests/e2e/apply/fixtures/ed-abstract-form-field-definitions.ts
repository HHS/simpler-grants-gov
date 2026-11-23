import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const ED_ABSTRACT_FORM_MATCHER = /ED Abstract Form/i;

export const ED_ABSTRACT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: ED_ABSTRACT_FORM_MATCHER,
  fields: {
    attachment: {
      testId: "file-input-input",
      field: "Attachment",
      type: "file",
    },
  },
} as const;

export const ED_ABSTRACT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachment-visible",
    message: "Attachment is required",
  },
];
