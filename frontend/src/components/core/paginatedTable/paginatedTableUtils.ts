import {
  PaginatedTableFetcher,
  PaginatedTableFetchResult,
} from "src/components/core/paginatedTable/paginatedTableTypes";

// Only one paginated table is supported per page, so the page number is always
// stored in this query param
export const PAGINATED_TABLE_PAGE_PARAM = "page";

// USWDS recommended number of slots for the pagination component
export const PAGINATED_TABLE_MAX_SLOTS = 7;

// Translates a raw `page` search param into a valid page number.
// Missing, non numeric, fractional, or non positive values resolve to page 1.
export const parsePageParam = (
  rawPage: string | string[] | null | undefined,
): number => {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  if (!value) {
    return 1;
  }
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

// Returns a copy of the current query string with the page param set
export const buildPageUrl = (
  pathname: string,
  currentSearchParams: string | URLSearchParams | null | undefined,
  page: number,
): string => {
  const params = new URLSearchParams(currentSearchParams?.toString() || "");
  params.set(PAGINATED_TABLE_PAGE_PARAM, page.toString());
  return `${pathname}?${params.toString()}`;
};

// Fetches the requested page. If that page is past the end of the data set
// (ex. a bookmarked link to page 5 after the number of records shrank to 3 pages)
// the last available page is fetched instead. Only a single retry is made, so if
// the data set keeps shrinking we will not loop.
export const fetchPageWithLastPageFallback = async <T>(
  fetchPage: PaginatedTableFetcher<T>,
  requestedPage: number,
): Promise<PaginatedTableFetchResult<T>> => {
  const response = await fetchPage(requestedPage);
  const totalPages = response.pagination_info?.total_pages || 0;

  if (!response.data.length && totalPages > 0 && requestedPage > totalPages) {
    const lastPageResponse = await fetchPage(totalPages);
    return {
      response: lastPageResponse,
      page: totalPages,
      requestedPage,
    };
  }

  return { response, page: requestedPage };
};
