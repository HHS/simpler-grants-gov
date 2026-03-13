export type AwardRecommendationStatus =
  | "draft"
  | "inProgress"
  | "pendingReview"
  | "approved";

export type AwardRecommendationDetails = {
  recordNumber: string;
  datePrepared: string;
  status: AwardRecommendationStatus;
};
