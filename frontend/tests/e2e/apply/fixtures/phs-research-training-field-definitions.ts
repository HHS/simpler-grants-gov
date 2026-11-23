import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PHS_RESEARCH_TRAINING_FORM_MATCHER =
  /PHS 398 Research Training Program Plan/i;

export const PHS_RESEARCH_TRAINING_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: PHS_RESEARCH_TRAINING_FORM_MATCHER,
  fields: {
    program_plan: {
      selector: "#program_plan-visible",
      field: "2. Program Plan",
      type: "file",
    },
  },
} as const;

export const PHS_RESEARCH_TRAINING_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "program_plan-visible",
    message: "2. Program Plan is required",
  },
];
