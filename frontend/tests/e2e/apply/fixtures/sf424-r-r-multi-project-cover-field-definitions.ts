import { fieldDefinitionsSF424RR } from "tests/e2e/apply/fixtures/sf424-r-r-field-definitions";
import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

// The SF-424 R&R Multi-Project Cover generated from forms/specs. Skip the SF-424 family's
// other forms.
export const SF424_R_R_MULTI_PROJECT_COVER_FORM_MATCHER =
  /SF-424 R&R Multi-Project Cover/i;

// The form reuses the SF-424 (R&R)'s questions, labels, and layout with every element
// optional, so reuse its field definitions.
export const fieldDefinitionsSF424RRMultiProjectCover: FormFillFieldDefinitions =
  fieldDefinitionsSF424RR;

export const SF424_R_R_MULTI_PROJECT_COVER_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "SF-424 R&R Multi-Project Cover",
  fields: fieldDefinitionsSF424RRMultiProjectCover,
} as const;
