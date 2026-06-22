"server-only";

import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { CreateOpportunityRecord } from "src/types/grantor/createOpportunityTypes";
import {
  PaginationRequestBody,
  SearchAPIResponse,
  SearchResponseData,
} from "src/types/search/searchRequestTypes";

type PaginationBody = {
  pagination: PaginationRequestBody;
};

export const searchOpportunitiesByAgency = async (
  agencyId: string,
  pageInputs: PaginationRequestBody,
): Promise<{ data: SearchResponseData; pagination_info: PaginationInfo }> => {
  const pagination = pageInputs;
  const pageBody: PaginationBody = { pagination };

  const response = await fetchGrantorWithMethod("POST")({
    subPath: `agencies/` + agencyId + `/opportunities`,
    body: pageBody,
  });
  return (await response.json()) as SearchAPIResponse;
};

export const createOpportunity = async (
  createOppSchema: Record<string, string>,
): Promise<CreateOpportunityRecord> => {
  const response = await fetchGrantorWithMethod("POST")({
    subPath: "opportunities",
    body: createOppSchema,
  });
  const json = (await response.json()) as { data: CreateOpportunityRecord };
  return json.data;
};

export const searchAccessibleOpportunities = async (
  pageInputs: PaginationRequestBody,
): Promise<{ data: SearchResponseData; pagination_info: PaginationInfo }> => {
  const response = await fetchGrantorWithMethod("POST")({
    subPath: "opportunities/list",
    body: { pagination: pageInputs },
  });

  return (await response.json()) as SearchAPIResponse;
};