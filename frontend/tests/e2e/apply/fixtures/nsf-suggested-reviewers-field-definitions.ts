import type { FillFormConfig } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

export const NSF_SUGGESTED_REVIEWERS_FORM_MATCHER =
  /NSF\s+Suggested\s+Reviewers/i;

// Both answers render as textareas, so target each by its field id.
export const NSF_SUGGESTED_REVIEWERS_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: NSF_SUGGESTED_REVIEWERS_FORM_MATCHER,
  fields: {
    suggestedReviewers: {
      selector: "#suggested_reviewers",
      printTestId: "suggested_reviewers",
      type: "text",
      maxLength: 4000,
      field: "Suggested reviewers",
    },
    reviewersNotToInclude: {
      selector: "#reviewers_not_to_include",
      printTestId: "reviewers_not_to_include",
      type: "text",
      maxLength: 4000,
      field: "Reviewers not to include",
    },
  },
} satisfies FillFormConfig;
