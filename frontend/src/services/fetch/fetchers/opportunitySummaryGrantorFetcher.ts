import {
  createGrantorOpportunitySummaryEndpoint,
  getGrantorOpportunityEndpoint,
  updateGrantorOpportunitySummaryEndpoint,
} from "src/services/fetch/endpointConfigs";
import {
  GrantorOpportunityApiResponse,
  OpportunitySummaryCreateRequest,
  OpportunitySummaryDetailApiResponse,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";

import { requesterForEndpoint } from "./fetchers";

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

const getGrantorOpportunityRequest = requesterForEndpoint(
  getGrantorOpportunityEndpoint,
);

const updateOpportunitySummaryRequest = requesterForEndpoint(
  updateGrantorOpportunitySummaryEndpoint,
);

const createOpportunitySummaryRequest = requesterForEndpoint(
  createGrantorOpportunitySummaryEndpoint,
);

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
  const response = await updateOpportunitySummaryRequest({
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
  const response = await createOpportunitySummaryRequest({
    subPath: `${opportunityId}/summaries`,
    body,
    additionalHeaders: { "X-SGG-Token": token },
  });

  return (await response.json()) as OpportunitySummaryDetailApiResponse;
}
