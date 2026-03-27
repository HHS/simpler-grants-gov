import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Budget Narrative Attachment Form" link/heading on the application page
export const BUDGET_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  "^Budget Narrative Attachment Form$";

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
