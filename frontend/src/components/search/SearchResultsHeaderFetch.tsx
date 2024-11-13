"use server";

import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import SearchResultsHeader from "./SearchResultsHeader";

export default async function SearchResultsHeaderFetch({
  searchResultsPromise,
  sortby,
  queryTerm,
}: {
  searchResultsPromise: Promise<SearchAPIResponse>;
  sortby: string | null;
  queryTerm: string | null | undefined;
}) {
  const searchResults = await searchResultsPromise;
  const totalResults = searchResults.pagination_info?.total_records;

  return (
    <SearchResultsHeader
      queryTerm={queryTerm}
      sortby={sortby}
      totalFetchedResults={String(totalResults)}
    />
  );
}
