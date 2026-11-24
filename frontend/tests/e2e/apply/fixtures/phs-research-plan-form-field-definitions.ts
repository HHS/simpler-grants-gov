import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PHS_RESEARCH_PLAN_FORM_MATCHER = /PHS 398 Research Plan/i;

export const PHS_RESEARCH_PLAN_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: PHS_RESEARCH_PLAN_FORM_MATCHER,
  fields: {
    research_strategy: {
      selector: 'input[name="research_strategy-visible"][type="file"]',
      field: "Research Strategy",
      type: "file",
    },
  },
} as const;

export const PHS_RESEARCH_PLAN_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "research_strategy-visible",
    message: "Research Strategy is required",
  },
];
