import {
  GrantorOpportunityApiResponse,
  OpportunitySummaryCreateRequest,
  OpportunitySummaryDetailApiResponse,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";

import {
  createGrantorOpportunitySummaryRequest,
  getGrantorOpportunityRequest,
  updateGrantorOpportunitySummaryRequest,
} from "./fetchers";

type UpdateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  opportunitySummaryId: string;
  body: OpportunitySummaryUpdateRequest;
  token: string;
};

type CreateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  body: OpportunitySummaryCreateRequest;
  token: string;
};

export async function getOpportunityForGrantor(
  opportunityId: string,
  token: string,
): Promise<GrantorOpportunityApiResponse> {
  const response = await getGrantorOpportunityRequest({
    subPath: opportunityId,
    additionalHeaders: { "X-SGG-Token": token },
  });
  return (await response.json()) as GrantorOpportunityApiResponse;
}

export async function updateOpportunitySummaryForGrantor({
  opportunityId,
  opportunitySummaryId,
  body,
  token,
}: UpdateOpportunitySummaryForGrantorParams): Promise<OpportunitySummaryDetailApiResponse> {
  const response = await updateGrantorOpportunitySummaryRequest({
    subPath: `${opportunityId}/summaries/${opportunitySummaryId}`,
    body,
    additionalHeaders: { "X-SGG-Token": token },
  });

  return (await response.json()) as OpportunitySummaryDetailApiResponse;
}

export async function createOpportunitySummaryForGrantor({
  opportunityId,
  body,
  token,
}: CreateOpportunitySummaryForGrantorParams): Promise<OpportunitySummaryDetailApiResponse> {
  const response = await createGrantorOpportunitySummaryRequest({
    subPath: `${opportunityId}/summaries`,
    body,
    additionalHeaders: { "X-SGG-Token": token },
    allowedErrorStatuses: [422],
  });

  const responseJson = await response.json();

  if (response.status === 422) {
    return { validationErrors: responseJson.errors };
  }

  return { data: responseJson.data };
}
