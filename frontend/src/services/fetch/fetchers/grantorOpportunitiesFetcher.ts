"server-only";

import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
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
  token: string,
  agencyId: string,
  pageInputs: PaginationRequestBody,
) => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const pagination = pageInputs;
  const pageBody: PaginationBody = { pagination };

  const response = await fetchGrantorWithMethod("POST")({
    subPath: `agencies/` + agencyId + `/opportunities`,
    additionalHeaders: ssgToken,
    body: pageBody,
  });
  const json = (await response.json()) as SearchAPIResponse;
  return json.data;
};

export const createOpportunity = async (
  token: string,
  createOppSchema: JSONRequestBody,
): Promise<CreateOpportunityRecord> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchGrantorWithMethod("POST")({
    subPath: `opportunities`,
    additionalHeaders: ssgToken,
    body: createOppSchema,
  });
  const json = (await response.json()) as { data: CreateOpportunityRecord };
  return json.data;
};
