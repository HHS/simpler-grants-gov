export type AwardRecommendationStatus =
  | "draft"
  | "inProgress"
  | "pendingReview";

export type AwardRecommendationDetails = {
  recordNumber: string;
  datePrepared: string;
  status: AwardRecommendationStatus;
};
