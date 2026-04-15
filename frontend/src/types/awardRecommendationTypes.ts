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

export type AwardRecommendationUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type AwardRecommendationAttachment = {
  award_recommendation_attachment_id: string;
  download_path: string;
  file_name: string;
  award_recommendation_attachment_type: string;
  uploading_user: AwardRecommendationUser;
  created_at: string;
  updated_at: string;
};

export type AwardRecommendationReview = {
  award_recommendation_review_id: string;
  award_recommendation_review_type: string;
  is_reviewed: boolean;
};

export type AwardRecommendationOpportunitySummary = {
  opportunity_status: string;
  summary_description: string;
};

export type AwardRecommendationOpportunity = {
  opportunity_id: string;
  opportunity_number: string;
  opportunity_title: string;
  summary: AwardRecommendationOpportunitySummary;
};

/**
 * AwardRecommendationDetails represents the data structure from the API
 */
export type AwardRecommendationDetails = {
  award_recommendation_id: string;
  award_recommendation_number: string;
  award_recommendation_status: AwardRecommendationStatus;
  award_selection_method: AwardSelectionMethod;
  funding_strategy?: string;
  selection_method_detail?: string;
  other_key_information?: string;
  additional_info?: string;
  review_workflow_id?: string;
  created_at?: string;
  updated_at?: string;
  opportunity: AwardRecommendationOpportunity;
  award_recommendation_attachments?: AwardRecommendationAttachment[];
  award_recommendation_reviews?: AwardRecommendationReview[];
  award_recommendation_summary?: AwardRecommendationSummary;
};
