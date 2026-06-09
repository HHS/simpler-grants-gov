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
  page: number,
): Promise<{ data: SearchResponseData; pagination_info: PaginationInfo }> => {
  const paginationDetails: PaginationRequestBody = {
    page_offset: page,
    page_size: 25,
    sort_order: [
      {
        order_by: "created_at",
        sort_direction: "descending",
      },
    ],
  };

  const response = await fetchGrantorWithMethod("POST")({
    subPath: `agencies/` + agencyId + `/opportunities`,
    body: { pagination: paginationDetails },
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
