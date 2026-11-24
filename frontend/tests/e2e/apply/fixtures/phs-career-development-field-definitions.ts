import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PHS_CAREER_DEVELOPMENT_FORM_MATCHER =
  /PHS 398 Career Development Award Supplemental Form/i;

export const PHS_CAREER_DEVELOPMENT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: PHS_CAREER_DEVELOPMENT_FORM_MATCHER,
  fields: {
    is_us_citizen_or_national: {
      selector: '#is_us_citizen_or_national >> role=radio[name="Yes"i]',
      printTestId: "is_us_citizen_or_national",
      field: "U.S. citizen or national",
      type: "radiobutton",
    },
    research_strategy: {
      selector: "#research_strategy-visible",
      field: "4. Research Strategy",
      type: "file",
    },
  },
} as const;

export const PHS_CAREER_DEVELOPMENT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "is_us_citizen_or_national",
    message: "U.S. Citizen or Non-Citizen National is required",
  },
  {
    fieldId: "research_strategy-visible",
    message: "Research Strategy is required",
  },
];
