import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Project Narrative Attachment" link/heading on the application page
export const PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  "^Project Narrative Attachment Form$";

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
