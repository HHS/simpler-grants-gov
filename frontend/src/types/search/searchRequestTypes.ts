export interface SearchFilterRequestBody {
  agency?: { one_of: string[] };
  opportunity_status?: { one_of: string[] };
  funding_instrument?: { one_of: string[] };
}

export type PaginationOrderBy = "opportunity_id" | "opportunity_number";
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
