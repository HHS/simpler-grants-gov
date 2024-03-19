export interface SearchFilterRequestBody {
  agency?: { one_of: string[] };
  opportunity_status?: { one_of: string[] };
  funding_instrument?: { one_of: string[] };
}

export interface PaginationRequestBody {
  order_by: string;
  page_offset: number;
  page_size: number;
  sort_direction: "ascending" | "descending";
}

export type SearchRequestBody = {
  pagination: PaginationRequestBody;
  filters?: SearchFilterRequestBody;
  query?: string;
};
