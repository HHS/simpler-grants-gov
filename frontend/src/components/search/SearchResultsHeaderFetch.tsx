"use server";
import { getSearchFetcher } from "src/services/search/searchfetcher/SearchFetcherUtil";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";
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
  const searchFetcher = getSearchFetcher();
  const searchResults = await searchFetcher.fetchOpportunities(searchParams);
  const totalResults = searchResults.pagination_info?.total_records;

  return (
    <SearchResultsHeader
      queryTerm={queryTerm}
      sortby={sortby}
      totalFetchedResults={String(totalResults)}
    />
  );
}
