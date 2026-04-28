import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Matches "Other Narrative Attachments" link/heading on the application page
export const OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  /Other Narrative Attachments/i;

export const fieldDefinitionsOtherNarrativeAttachment: FormFillFieldDefinitions =
  {
    attachments: {
      testId: "file-input-input",
      type: "file",
      field: "Other Narrative Files",
    },
  };

export const OTHER_NARRATIVE_ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Other Narrative Attachments",
  fields: fieldDefinitionsOtherNarrativeAttachment,
} as const;

// Required field validation errors for Other Narrative Attachments form
export const OTHER_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachments",
    message: "Other Narrative Files is required",
  },
];
