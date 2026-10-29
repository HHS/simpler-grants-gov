import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
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

// Errors anchor to the visible file chooser (`attachments-visible`), not the hidden value
// input, so the alert link focuses the control the user acts on.
export const OTHER_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachments-visible",
    message: "Other Narrative Files is required",
  },
];
