"use server";

import fetchers from "src/app/api/Fetchers";
import { QueryParamData } from "src/types/search/searchRequestTypes";

import SearchResultsHeader from "./SearchResultsHeader";

export default async function SearchResultsHeaderFetch({
  searchParams,
  sortby,
  queryTerm,
}: {
  searchParams: QueryParamData;
  sortby: string | null;
  queryTerm: string | null | undefined;
}) {
  const searchResults =
    await fetchers.searchOpportunityFetcher.searchOpportunities(searchParams);
  const totalResults = searchResults.pagination_info?.total_records;

  return (
    <SearchResultsHeader
      queryTerm={queryTerm}
      sortby={sortby}
      totalFetchedResults={String(totalResults)}
    />
  );
}
