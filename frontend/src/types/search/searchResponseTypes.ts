import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";

export type SearchResponseData = BaseOpportunity[];

export const backendFilterNames = [
  "opportunity_status",
  "funding_instrument",
  "applicant_type",
  "agency",
  "funding_category",
] as const;

export const searchFilterNames = [
  "status",
  "fundingInstrument",
  "eligibility",
  "agency",
  "category",
] as const;

// this is used for UI display so order matters
export const validSearchQueryParamKeys = [
  "query",
  ...searchFilterNames,
  "page",
  "sortby",
] as const;

// Only a few defined keys possible
// URL example => ?query=abcd&status=closed,archived
export type ValidSearchQueryParam = (typeof validSearchQueryParamKeys)[number];

export type FrontendFilterNames = (typeof searchFilterNames)[number];
export type BackendFilterNames = (typeof backendFilterNames)[number];

export type FacetCounts = {
  [key in BackendFilterNames]: {
    [key: string]: number;
  };
};

export interface SearchAPIResponse extends APIResponse {
  data: SearchResponseData;
  pagination_info: PaginationInfo;
  facet_counts: FacetCounts;
  // these are set on the frontend after fetch, not coming back from API
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}
