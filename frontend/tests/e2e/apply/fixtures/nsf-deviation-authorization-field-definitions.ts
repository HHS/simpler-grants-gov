import type { FillFormConfig } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const NSF_DEVIATION_AUTHORIZATION_FORM_MATCHER =
  /NSF\s+Deviation\s+Authorization/i;

export const NSF_DEVIATION_AUTHORIZATION_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: NSF_DEVIATION_AUTHORIZATION_FORM_MATCHER,
  fields: {
    deviationAuthorization: {
      testId: "textarea",
      printTestId: "deviation_authorization",
      type: "text",
      field: "Deviation authorization information",
    },
  },
} satisfies FillFormConfig;
