"use server";

import fetchers from "src/app/api/Fetchers";
import { QueryParamData } from "src/types/search/searchRequestTypes";

import SearchPagination from "src/components/search/SearchPagination";

interface SearchPaginationProps {
  searchParams: QueryParamData;
  // Determines whether clicking on pager items causes a scroll to the top of the search
  // results. Created so the bottom pager can scroll.
  scroll: boolean;
}

export default async function SearchPaginationFetch({
  searchParams,
  scroll,
}: SearchPaginationProps) {
  const searchResults =
    await fetchers.searchOpportunityFetcher.searchOpportunities(searchParams);
  const totalPages = searchResults.pagination_info?.total_pages;
  const totalResults = searchResults.pagination_info?.total_records;

  return (
    <>
      <SearchPagination
        total={totalPages}
        page={searchParams.page}
        query={searchParams.query}
        scroll={scroll}
        totalResults={String(totalResults)}
      />
    </>
  );
}
