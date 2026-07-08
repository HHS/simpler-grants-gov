import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

export type AwardRecommendationStatus = "draft" | "in_review" | "approved";

export type AwardSelectionMethod = "merit-review-only" | "merit-review-other";

export type AwardRecommendationType =
  | "recommended_for_funding"
  | "recommended_without_funding"
  | "not_recommended";

export type AwardRecommendationSummary = {
  total_received_count: number;
  recommended_for_funding_count: number;
  recommended_without_funding_count: number;
  not_recommended_count: number;
  total_recommended_amount: number;
};

export type AwardRecommendationListSummary = Pick<
  AwardRecommendationSummary,
  "total_received_count"
>;

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
export type ApplicationSubmissionInfo = {
  award_recommendation_application_submission_id: string;
  application_submission_id: string;
  application_submission_number: string;
};

export type AwardRecommendationRisk = {
  award_recommendation_risk_id: string;
  award_recommendation_risk_number?: string;
  risk_number: number;
  comment?: string;
  award_recommendation_risk_type?: string;
  condition: string;
  condition_number?: string;
  award_recommendation_application_submission_ids: string[];
  applications: ApplicationSubmissionInfo[];
  created_at?: string;
  updated_at?: string;
};

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

export type AwardRecommendationListItem = Omit<
  Pick<
    AwardRecommendationDetails,
    | "award_recommendation_id"
    | "award_recommendation_number"
    | "award_recommendation_status"
    | "opportunity"
    | "award_recommendation_summary"
  >,
  "award_recommendation_summary"
> & {
  award_recommendation_summary?: AwardRecommendationListSummary;
};

export type AwardRecommendationListFilters = {
  agency_id: { one_of: string[] };
};

export type AwardRecommendationListRequestBody = {
  filters: AwardRecommendationListFilters;
  pagination: PaginationRequestBody;
};

export type AwardRecommendationOrganization = {
  organization_id: string;
  organization_name?: string;
  uei?: string;
};

export type AwardRecommendationApplication = {
  application_id: string;
  competition_id: string;
  organization?: AwardRecommendationOrganization;
};

export type AwardRecommendationApplicationSubmission = {
  application_submission_id: string;
  application_submission_number?: string;
  project_title?: string;
  total_requested_amount?: string;
  application?: AwardRecommendationApplication;
};

export type AwardRecommendationSubmissionListFilters = {
  award_recommendation_type?: { one_of: AwardRecommendationType[] };
  has_exception?: { one_of: boolean[] };
};

export type AwardRecommendationSubmissionDetail = {
  recommended_amount?: string;
  scoring_comment?: string;
  general_comment?: string;
  award_recommendation_type?: AwardRecommendationType;
  has_exception?: boolean;
  exception_detail?: string;
};

export type AwardRecommendationSubmissionDetailUpdate = {
  recommended_amount?: string;
  general_comment?: string | null;
  award_recommendation_type?: AwardRecommendationType;
  has_exception?: boolean;
  exception_detail?: string | null;
};

export type AwardRecommendationSubmission = {
  award_recommendation_application_submission_id: string;
  application_submission: AwardRecommendationApplicationSubmission;
  submission_detail?: AwardRecommendationSubmissionDetail;
};
