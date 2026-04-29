import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Matches "Project Narrative Attachment Form" link/heading on the application page
export const PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  /Project Narrative Attachment Form/i;

export const fieldDefinitionsProjectNarrativeAttachment: FormFillFieldDefinitions =
  {
    attachments: {
      testId: "file-input-input",
      type: "file",
      field: "Project Narrative Files",
    },
  };

export const PROJECT_NARRATIVE_ATTACHMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Project Narrative Attachment",
  fields: fieldDefinitionsProjectNarrativeAttachment,
} as const;

// Required field validation errors for Project Narrative Attachments form
export const PROJECT_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS: FieldError[] =
  [
    {
      fieldId: "attachments",
      message: "Project Narrative Files is required",
    },
  ];
