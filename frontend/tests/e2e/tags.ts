enum validFeatureTags {
  APPLY_FORMS = "@apply-forms",
  DISCOVERY = "@discovery",
}

enum validExecutionTags {
  SMOKE = "@smoke",
  FULL_REGRESSION = "@full-regression",
}

export const VALID_TAGS = { ...validExecutionTags, ...validFeatureTags };
