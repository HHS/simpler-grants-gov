import "server-only";

import {
  GrantorOpportunityApiResponse,
  OpportunitySummaryCreateRequest,
  OpportunitySummaryDetailApiResponse,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";

import { fetchGrantorOpportunityWithMethod } from "./fetchers";

type UpdateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  opportunitySummaryId: string;
  body: OpportunitySummaryUpdateRequest;
};

type CreateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  body: OpportunitySummaryCreateRequest;
};

export async function getOpportunityForGrantor(
  opportunityId: string,
): Promise<GrantorOpportunityApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("GET")({
    subPath: opportunityId,
  });
  return (await response.json()) as GrantorOpportunityApiResponse;
}

export async function updateOpportunitySummaryForGrantor({
  opportunityId,
  opportunitySummaryId,
  body,
}: UpdateOpportunitySummaryForGrantorParams): Promise<OpportunitySummaryDetailApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("PUT")({
    subPath: `${opportunityId}/summaries/${opportunitySummaryId}`,
    body,
  });

  return (await response.json()) as OpportunitySummaryDetailApiResponse;
}

export async function createOpportunitySummaryForGrantor({
  opportunityId,
  body,
}: CreateOpportunitySummaryForGrantorParams): Promise<OpportunitySummaryDetailApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/summaries`,
    body,
  });

  return (await response.json()) as OpportunitySummaryDetailApiResponse;
}

export async function publishOpportunityForGrantor(
  opportunityId: string,
): Promise<GrantorOpportunityApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/publish`,
  });

  return (await response.json()) as GrantorOpportunityApiResponse;
}
