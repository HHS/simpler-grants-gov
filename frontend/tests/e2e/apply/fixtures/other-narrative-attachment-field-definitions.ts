import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

// Matches "Other Narrative Attachments" link/heading on the application page
export const OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER =
  "^Other Narrative Attachments$";

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
