export const AwardSelectionMethod = {
  MERIT_REVIEW_RANKING_ONLY: "merit_review_ranking_only",
  MERIT_REVIEW_RANKING_WITH_OTHER_FACTORS:
    "merit_review_ranking_with_other_factors",
  FORMULA: "formula",
  SINGLE_SOURCE: "single_source",
  SOLE_SOURCE: "sole_source",
  OTHER: "other",
} as const;

export type AwardSelectionMethod =
  (typeof AwardSelectionMethod)[keyof typeof AwardSelectionMethod];
