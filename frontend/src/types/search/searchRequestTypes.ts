import { ValidSearchQueryParam } from "./searchResponseTypes";

export interface SearchFilterRequestBody {
  opportunity_status?: { one_of: string[] };
  funding_instrument?: { one_of: string[] };
  applicant_type?: { one_of: string[] };
  agency?: { one_of: string[] };
  funding_category?: { one_of: string[] };
}

export type PaginationOrderBy =
  | "relevancy"
  | "opportunity_id"
  | "opportunity_number"
  | "opportunity_title"
  | "agency_name"
  | "top_level_agency_code"
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
};

export enum SearchFetcherActionType {
  // Just 2 types at the moment
  InitialLoad = "initialLoad",
  Update = "update",
}

export type QuerySetParam = string | string[] | undefined;

export type SortOptions =
  | "relevancy"
  | "postedDateDesc"
  | "postedDateAsc"
  | "closeDateDesc"
  | "closeDateAsc"
  | "opportunityTitleAsc"
  | "opportunityTitleDesc"
  | "agencyAsc"
  | "agencyDesc"
  | "opportunityNumberDesc"
  | "opportunityNumberAsc";

export type SortOption = {
  label: string;
  value: SortOptions;
};

export interface FilterQueryParamData {
  status: Set<string>;
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
}

// used for now in the process of performing a search request. To be deprecated.
export interface QueryParamData extends FilterQueryParamData {
  page: number;
  sortby: SortOptions | null;
  query?: string | null;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}

// Search definition as formatted for storage as a saved search
export type SavedSearchQuery = {
  filters: SearchFilterRequestBody;
  pagination: PaginationRequestBody;
  query: string;
};

// relevant portions of the response payload from fetching a user's saved searches
export type SavedSearchRecord = {
  name: string;
  saved_search_id: string;
  search_query: SavedSearchQuery;
};

export type ValidSearchQueryParamData = {
  [k in ValidSearchQueryParam]?: string;
};
