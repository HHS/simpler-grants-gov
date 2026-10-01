import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Matches "Budget Narrative Attachment Form" link/heading on the application page
export const BUDGET_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  /Budget Narrative Attachment Form/i;

export const fieldDefinitionsBudgetNarrativeAttachment: FormFillFieldDefinitions =
  {
    attachments: {
      testId: "file-input-input",
      type: "file",
      field: "Budget Narrative Files",
    },
  };

export const BUDGET_NARRATIVE_ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Budget Narrative Attachment Form",
  fields: fieldDefinitionsBudgetNarrativeAttachment,
} as const;

// Errors anchor to the visible file chooser (`attachments-visible`), not the hidden value
// input, so the alert link focuses the control the user acts on.
export const BUDGET_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachments-visible",
    message: "Budget Narrative Files is required",
  },
];
