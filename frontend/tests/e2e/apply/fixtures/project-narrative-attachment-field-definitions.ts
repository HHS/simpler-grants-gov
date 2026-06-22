import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Matches "Project Narrative Attachment Form" link/heading on the application page
export const PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  /Project Narrative Attachment Form/i;

// Field ID mapping for API schema to test field IDs
export const PROJECT_NARRATIVE_ATTACHMENT_FIELD_ID_MAP: Record<string, string> = {
  "project_narrative_files": "project_narrative_files",
};

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
