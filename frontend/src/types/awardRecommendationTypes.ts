export type AwardRecommendationStatus =
  | "draft"
  | "in_progress"
  | "pending_review";

export type AwardRecommendationDetails = {
  recordNumber: string;
  datePrepared: string;
  status: AwardRecommendationStatus;
};
