"server-only";

import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";
import { CreateOpportunityRecord } from "src/types/grantor/createOpportunityTypes";
import {
  PaginationRequestBody,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

type PaginationBody = {
  pagination: PaginationRequestBody;
};

export const searchOpportunitiesByAgency = async (
  agencyId: string,
  pageInputs: PaginationRequestBody,
) => {
  const pagination = pageInputs;
  const pageBody: PaginationBody = { pagination };

  const response = await fetchGrantorWithMethod("POST")({
    subPath: `agencies/` + agencyId + `/opportunities`,
    body: pageBody,
  });
  const json = (await response.json()) as SearchAPIResponse;
  return json.data;
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
