import "server-only";

import {
  CompetitionCreateApiResponse,
  CompetitionCreateRequest,
} from "src/types/competitionsResponseTypes";
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

export async function createCompetitionForGrantor(
  opportunityId: string,
): Promise<CompetitionCreateApiResponse> {
  // All nullable fields are intentionally null; competition_title is intentionally ""
  // because the API accepts an empty string and the grantor fills it in later.
  // open_to_applicants requires minItems: 1, so both values are sent as the most
  // permissive default until the grantor configures the field.
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/competitions`,
    body: {
      competition_title: "",
      opening_date: null,
      closing_date: null,
      contact_info: null,
      open_to_applicants: ["individual", "organization"],
    } satisfies CompetitionCreateRequest,
  });
  return (await response.json()) as CompetitionCreateApiResponse;
}
