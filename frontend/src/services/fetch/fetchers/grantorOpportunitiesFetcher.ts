"server-only";

import {
  fetchGrantorAgenciesWithMethod,
  fetchGrantorOpportunityWithMethod,
} from "src/services/fetch/fetchers/fetchers";
import { PaginationInfo } from "src/types/apiResponseTypes";
import {
  CompetitionSaveApiResponse,
  CompetitionSaveRequest,
} from "src/types/competitionsResponseTypes";
import { CreateOpportunityRecord } from "src/types/grantor/createOpportunityTypes";
import {
  GrantorOpportunityApiResponse,
  OpportunitySummaryCreateRequest,
  OpportunitySummaryDetailApiResponse,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";
import {
  PaginationRequestBody,
  SearchAPIResponse,
  SearchResponseData,
} from "src/types/search/searchRequestTypes";

type PaginationBody = {
  pagination: PaginationRequestBody;
};

type UpdateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  opportunitySummaryId: string;
  body: OpportunitySummaryUpdateRequest;
};

type CreateOpportunitySummaryForGrantorParams = {
  opportunityId: string;
  body: OpportunitySummaryCreateRequest;
};

export const searchOpportunitiesByAgency = async (
  agencyId: string,
  pageInputs: PaginationRequestBody,
): Promise<{ data: SearchResponseData; pagination_info: PaginationInfo }> => {
  const pagination = pageInputs;
  const pageBody: PaginationBody = { pagination };

  const response = await fetchGrantorAgenciesWithMethod("POST")({
    subPath: `${agencyId}/opportunities`,
    body: pageBody,
  });
  return (await response.json()) as SearchAPIResponse;
};

export const searchAccessibleOpportunities = async (
  pageInputs: PaginationRequestBody,
): Promise<{ data: SearchResponseData; pagination_info: PaginationInfo }> => {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: "list",
    body: { pagination: pageInputs },
  });

  return (await response.json()) as SearchAPIResponse;
};

export async function getOpportunityForGrantor(
  opportunityId: string,
): Promise<GrantorOpportunityApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("GET")({
    subPath: opportunityId,
  });
  return (await response.json()) as GrantorOpportunityApiResponse;
}

export const createOpportunity = async (
  createOppSchema: Record<string, string>,
): Promise<CreateOpportunityRecord> => {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    body: createOppSchema,
  });
  const json = (await response.json()) as { data: CreateOpportunityRecord };
  return json.data;
};

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
  data: CompetitionSaveRequest,
): Promise<CompetitionSaveApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("POST")({
    subPath: `${opportunityId}/competitions`,
    body: data,
  });
  return (await response.json()) as CompetitionSaveApiResponse;
}

export async function updateCompetitionForGrantor(
  opportunityId: string,
  competitionId: string,
  data: CompetitionSaveRequest,
): Promise<CompetitionSaveApiResponse> {
  const response = await fetchGrantorOpportunityWithMethod("PUT")({
    subPath: `${opportunityId}/competitions/${competitionId}`,
    body: data,
  });
  return (await response.json()) as CompetitionSaveApiResponse;
}
