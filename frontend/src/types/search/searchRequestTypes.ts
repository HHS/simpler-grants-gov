export interface SearchFilterRequestBody {
  opportunity_status?: { one_of: string[] };
  funding_instrument?: { one_of: string[] };
  applicant_type?: { one_of: string[] };
  agency?: { one_of: string[] };
  funding_category?: { one_of: string[] };
}

export type PaginationOrderBy =
  | "opportunity_id"
  | "opportunity_number"
  | "opportunity_title"
  | "agency_code"
  | "post_date"
  | "close_date";
export type PaginationSortDirection = "ascending" | "descending";
export interface PaginationRequestBody {
  order_by: PaginationOrderBy;
  page_offset: number;
  page_size: number;
  sort_direction: PaginationSortDirection;
}

export type SearchRequestBody = {
  pagination: PaginationRequestBody;
  filters?: SearchFilterRequestBody;
  query?: string;
};

export enum SearchFetcherActionType {
  // Just 2 types at the moment
  InitialLoad = "initialLoad",
  Update = "update",
}

export interface QueryParamData {
  page: number;
  query: string | null | undefined;
  status: Set<string>;
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  sortby: string | null;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}
