import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationDetails,
  AwardRecommendationRisk,
  AwardRecommendationSubmission,
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
  const apiData = responseBody.data as Partial<AwardRecommendationDetails>;

  return {
    ...apiData,
    award_recommendation_summary: apiData.award_recommendation_summary || {
      total_received_count: 200,
      recommended_for_funding_count: 150,
      recommended_without_funding_count: 25,
      not_recommended_count: 25,
      total_recommended_amount: 250000,
    },
  } as AwardRecommendationDetails;
};

export const listAwardRecommendationSubmissions = async (
  id: string,
): Promise<AwardRecommendationSubmission[]> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: `${id}/submissions/list`,
    body: {
      pagination: {
        page_offset: 1,
        page_size: 100,
        sort_order: [
          {
            order_by: "application_submission_number",
            sort_direction: "ascending",
          },
        ],
      },
    },
  });
  const responseBody = (await response.json()) as APIResponse;

  return responseBody.data as AwardRecommendationSubmission[];
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
