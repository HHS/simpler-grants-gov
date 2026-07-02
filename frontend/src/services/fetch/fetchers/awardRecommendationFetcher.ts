import { AwardSelectionMethod } from "src/constants/awardRecommendation";
import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import {
  AwardRecommendationDetails,
  AwardRecommendationListItem,
  AwardRecommendationListRequestBody,
  AwardRecommendationRisk,
  AwardRecommendationSubmission,
  AwardRecommendationSubmissionDetailUpdate,
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

export const listAwardRecommendationsPaginated = async (
  agencyId: string,
  pagination: PaginationRequestBody,
): Promise<{
  awardRecommendations: AwardRecommendationListItem[];
  paginationInfo: PaginationInfo | undefined;
}> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: "list",
    body: {
      filters: { agency_id: { one_of: [agencyId] } },
      pagination,
    } satisfies AwardRecommendationListRequestBody,
  });
  const responseBody = (await response.json()) as APIResponse;

  return {
    awardRecommendations:
      (responseBody.data as AwardRecommendationListItem[]) || [],
    paginationInfo: responseBody.pagination_info,
  };
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

const defaultRisksListPagination: PaginationRequestBody = {
  page_offset: 1,
  page_size: 100,
  sort_order: [
    {
      order_by: "created_at",
      sort_direction: "ascending",
    },
  ],
};

export const getAwardRecommendationRisk = async (
  awardRecommendationId: string,
  riskId: string,
): Promise<AwardRecommendationRisk | null> => {
  const { risks } = await getAwardRecommendationRisks(
    awardRecommendationId,
    defaultRisksListPagination,
  );

  return (
    risks.find((risk) => risk.award_recommendation_risk_id === riskId) ?? null
  );
};

export const getAwardRecommendationSubmissionsForRisk = async (
  awardRecommendationId: string,
  submissionIds: string[],
): Promise<AwardRecommendationSubmission[]> => {
  if (submissionIds.length === 0) {
    return [];
  }

  const submissions = await listAwardRecommendationSubmissions(
    awardRecommendationId,
  );
  const submissionIdSet = new Set(submissionIds);

  return submissions.filter((submission) =>
    submissionIdSet.has(
      submission.award_recommendation_application_submission_id,
    ),
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

export const createAwardRecommendationRisk = async (
  awardRecommendationId: string,
  riskData: {
    comment: string;
    award_recommendation_risk_type: string;
    award_recommendation_application_submission_ids: string[];
  },
): Promise<AwardRecommendationRisk> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: `${awardRecommendationId}/risks`,
    body: riskData,
  });
  const responseBody = (await response.json()) as APIResponse;
  return responseBody.data as AwardRecommendationRisk;
};

export const updateAwardRecommendationRisk = async (
  awardRecommendationId: string,
  riskId: string,
  riskData: {
    comment: string;
    award_recommendation_risk_type: string;
    award_recommendation_application_submission_ids: string[];
  },
): Promise<AwardRecommendationRisk> => {
  const response = await fetchAwardRecommendationWithMethod("PUT")({
    subPath: `${awardRecommendationId}/risks/${riskId}`,
    body: riskData,
  });
  const responseBody = (await response.json()) as APIResponse;

  if (!response.ok) {
    throw new Error(responseBody.message || "Failed to update risk");
  }

  return responseBody.data as AwardRecommendationRisk;
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
  awardSelectionMethod: AwardSelectionMethod,
): Promise<AwardRecommendationDetails> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: "",
    body: {
      opportunity_id: opportunityId,
      award_selection_method: awardSelectionMethod,
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

export const updateAwardRecommendationSubmissionDetails = async (
  awardRecommendationId: string,
  awardRecommendationSubmissions: Record<
    string,
    AwardRecommendationSubmissionDetailUpdate
  >,
): Promise<AwardRecommendationSubmission[]> => {
  const response = await fetchAwardRecommendationWithMethod("PUT")({
    subPath: `${awardRecommendationId}/submission-details`,
    body: {
      award_recommendation_submissions: awardRecommendationSubmissions,
    },
  });
  const responseBody = (await response.json()) as APIResponse;

  if (!response.ok) {
    throw new Error(
      responseBody.message || "Failed to save submission details",
    );
  }

  return (responseBody.data as AwardRecommendationSubmission[]) || [];
};
