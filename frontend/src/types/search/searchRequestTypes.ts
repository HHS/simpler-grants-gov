import { APIResponse, PaginationInfo } from "src/types/apiResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { BackendFilterNames } from "./searchFilterTypes";
import { FilterQueryParamData } from "./searchQueryTypes";
import { SortOptions } from "./searchSortTypes";

export type OneOfFilter = { one_of: string[] };
export type RelativeDateRangeFilter =
  | { end_date_relative: number }
  | { start_date_relative: number };
export type BooleanFilter = { one_of: boolean[] };

export interface SearchFilterRequestBody {
  opportunity_status?: OneOfFilter;
  assistance_listing_number?: OneOfFilter;
  funding_instrument?: OneOfFilter;
  applicant_type?: OneOfFilter;
  agency?: OneOfFilter;
  funding_category?: OneOfFilter;
  close_date?: RelativeDateRangeFilter;
  post_date?: RelativeDateRangeFilter;
  is_cost_sharing?: BooleanFilter;
  top_level_agency?: OneOfFilter;
}

export type QueryOperator = "AND" | "OR";

export type PaginationOrderBy =
  | "relevancy"
  | "opportunity_id"
  | "opportunity_number"
  | "opportunity_title"
  | "agency_name"
  | "assistance_listing_number"
  | "top_level_agency_name"
  | "post_date"
  | "close_date";
export type PaginationSortDirection = "ascending" | "descending";
export type PaginationSortOrder = {
  order_by: PaginationOrderBy;
  sort_direction: PaginationSortDirection;
}[];
export interface PaginationRequestBody {
  page_offset: number;
  page_size: number;
  sort_order: PaginationSortOrder;
}

export type SearchRequestBody = {
  pagination: PaginationRequestBody;
  filters?: SearchFilterRequestBody;
  query?: string;
  format?: string;
  query_operator?: QueryOperator;
};

export enum SearchFetcherActionType {
  // Just 2 types at the moment
  InitialLoad = "initialLoad",
  Update = "update",
}

// Search definition as formatted for storage as a saved search
export type SavedSearchQuery = {
  filters: SearchFilterRequestBody;
  pagination: PaginationRequestBody;
  query: string;
  query_operator: QueryOperator;
};

// relevant portions of the response payload from fetching a user's saved searches
export type SavedSearchRecord = {
  name: string;
  saved_search_id: string;
  search_query: SavedSearchQuery;
};

export type SearchResponseData = BaseOpportunity[];

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

// used for now in the process of performing a search request. To be deprecated.
export interface QueryParamData extends FilterQueryParamData {
  page: number;
  sortby: SortOptions | null;
  query?: string | null;
  andOr?: QueryOperator;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}
