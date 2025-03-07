import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";

export type SearchResponseData = BaseOpportunity[];

export interface SearchAPIResponse extends APIResponse {
  data: SearchResponseData;
  pagination_info: PaginationInfo;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}

export const validSearchQueryParamKeys = [
  "page",
  "query",
  "sortby",
  "status",
  "fundingInstrument",
  "eligibility",
  "agency",
  "category",
] as const;

// Only a few defined keys possible
// URL example => ?query=abcd&status=closed,archived
export type ValidSearchQueryParam = (typeof validSearchQueryParamKeys)[number];
