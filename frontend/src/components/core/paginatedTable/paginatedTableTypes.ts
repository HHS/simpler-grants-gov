import { PaginationInfo } from "src/types/apiResponseTypes";

// the subset of the API's pagination_info that the paginated table relies on
export type PaginatedTablePaginationInfo = Pick<
  PaginationInfo,
  "page_offset" | "total_pages" | "total_records"
> &
  Partial<PaginationInfo>;

export interface PaginatedTableResponse<T> {
  data: T[];
  pagination_info: PaginatedTablePaginationInfo;
}

// Fetches a single (1-indexed) page of data. Any sort order, page size or
// fixed filters are expected to be defined within the fetcher itself.
export type PaginatedTableFetcher<T> = (
  page: number,
) => Promise<PaginatedTableResponse<T>>;

export interface PaginatedTableFetchResult<T> {
  response: PaginatedTableResponse<T>;
  // the page that the displayed data belongs to
  page: number;
  // set when the requested page was past the end of the data set, and the
  // last available page was fetched in its place
  requestedPage?: number;
}
