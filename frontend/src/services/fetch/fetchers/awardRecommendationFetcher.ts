import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationDetails,
  AwardRecommendationRisk,
  AwardRecommendationSubmission,
  AwardRecommendationSubmissionListFilters,
} from "src/types/awardRecommendationTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import {
  fetchAwardRecommendation,
  fetchAwardRecommendationWithMethod,
} from "./fetchers";

export const getAwardRecommendationDetails = async (
  id: string,
): Promise<AwardRecommendationDetails> => {
  const response = await fetchAwardRecommendation({ subPath: id });
  const responseBody = (await response.json()) as APIResponse;
  return responseBody.data as AwardRecommendationDetails;
};

export const listAwardRecommendationSubmissionsPaginated = async (
  id: string,
  pagination: PaginationRequestBody,
  filters?: AwardRecommendationSubmissionListFilters,
): Promise<{
  submissions: AwardRecommendationSubmission[];
  paginationInfo: PaginationInfo | undefined;
}> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: `${id}/submissions/list`,
    body: {
      ...(filters ? { filters } : {}),
      pagination,
    },
  });
  const responseBody = (await response.json()) as APIResponse;

  return {
    submissions: (responseBody.data as AwardRecommendationSubmission[]) || [],
    paginationInfo: responseBody.pagination_info,
  };
};

export const listAwardRecommendationSubmissions = async (
  id: string,
): Promise<AwardRecommendationSubmission[]> => {
  const { submissions } = await listAwardRecommendationSubmissionsPaginated(
    id,
    {
      page_offset: 1,
      page_size: 100,
      sort_order: [
        {
          order_by: "application_submission_number",
          sort_direction: "ascending",
        },
      ],
    },
  );

  return submissions;
};

export const getAwardRecommendationSubmission = async (
  id: string,
  submissionId: string,
): Promise<AwardRecommendationSubmission | null> => {
  const submissions = await listAwardRecommendationSubmissions(id);

  return (
    submissions.find(
      (submission) =>
        submission.award_recommendation_application_submission_id ===
        submissionId,
    ) ?? null
  );
};

export const getAwardRecommendationRisks = async (
  id: string,
  pagination: PaginationRequestBody,
): Promise<{
  risks: AwardRecommendationRisk[];
  paginationInfo: PaginationInfo | undefined;
}> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: `${id}/risks/list`,
    body: { pagination },
  });
  const responseBody = (await response.json()) as APIResponse;
  return {
    risks: (responseBody.data as AwardRecommendationRisk[]) || [],
    paginationInfo: responseBody.pagination_info,
  };
};

export const deleteAwardRecommendationRisk = async (
  awardRecommendationId: string,
  riskId: string,
): Promise<{ success: boolean; message?: string }> => {
  const response = await fetchAwardRecommendationWithMethod("DELETE")({
    subPath: `${awardRecommendationId}/risks/${riskId}`,
  });
  const responseBody = (await response.json()) as APIResponse;
  return {
    success: response.ok,
    message: responseBody.message,
  };
};

export const createAwardRecommendation = async (
  opportunityId: string,
): Promise<AwardRecommendationDetails> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: "",
    body: {
      opportunity_id: opportunityId,
      award_selection_method: "merit_review_ranking_only",
      additional_info: null,
      funding_strategy: null,
      selection_method_detail: null,
      other_key_information: null,
    },
  });

  const responseBody = (await response.json()) as APIResponse;

  if (!response.ok) {
    throw new Error(
      responseBody.message || "Failed to create award recommendation",
    );
  }

  return responseBody.data as AwardRecommendationDetails;
};
