export type AwardRecommendationStatus =
  | "draft"
  | "inProgress"
  | "pendingReview"
  | "approved";

export type AwardSelectionMethod = "merit-review-only" | "merit-review-other";

export type AwardRecommendationSummary = {
  total_received_count: number;
  recommended_for_funding_count: number;
  recommended_without_funding_count: number;
  not_recommended_count: number;
  total_recommended_amount: number;
};

export type AwardRecommendationOpportunity = {
  opportunity_id: string;
  opportunity_number: string;
  opportunity_title: string;
  summary: {
    opportunity_status: string;
    summary_description: string;
  };
};

export type AwardRecommendationDetails = {
  award_recommendation_id: string;
  award_recommendation_number: string;
  award_recommendation_status: AwardRecommendationStatus;
  award_selection_method: AwardSelectionMethod;
  award_selection_method_details: string;
  funding_strategy: string;
  other_key_information: string;
  additional_info: string;
  review_workflow_id: string;
  award_recommendation_summary?: AwardRecommendationSummary;
  opportunity: AwardRecommendationOpportunity;
  recordNumber: string;
  datePrepared: string;
  status: AwardRecommendationStatus;
};
