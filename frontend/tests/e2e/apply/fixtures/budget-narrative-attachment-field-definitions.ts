import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";
import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";

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

// Required field validation errors for Budget Narrative Attachment form
export const BUDGET_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "attachments",
    message: "Budget Narrative Files is required",
  },
];
