import { searchForOpportunities } from "src/services/fetch/fetchers/searchFetcher";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { Suspense } from "react";

import Loading from "src/components/Loading";
import SearchPagination from "src/components/search/SearchPagination";
import SearchResultsHeader from "src/components/search/SearchResultsHeader";
import { ClientSideUrlUpdater } from "../ClientSideUrlUpdater";
import { ExportSearchResultsButton } from "./ExportSearchResultsButton";
import SearchResultsList from "./SearchResultsList";

const SearchResultsSkeleton = ({
  sortby,
  page,
  query,
  loadingMessage,
}: {
  sortby: string | null;
  page: number;
  query?: string | null;
  loadingMessage: string;
}) => {
  return (
    <>
      <SearchResultsHeader sortby={sortby} />
      <div className="usa-prose">
        <div className="tablet-lg:display-flex">
          <SearchPagination loading={true} page={page} query={query} />
        </div>
        <Loading message={loadingMessage} />
        <SearchPagination loading={true} page={page} query={query} />
      </div>
    </>
  );
};

const ResolvedSearchResults = async ({
  sortby,
  page,
  query,
  searchResultsPromise,
}: {
  sortby: string | null;
  page: number;
  query?: string | null;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) => {
  const searchResults = await searchResultsPromise;
  if (
    !searchResults.data.length &&
    searchResults.pagination_info.page_offset >
      searchResults.pagination_info.total_pages
  ) {
    return (
      <ClientSideUrlUpdater
        param={"page"}
        value={searchResults.pagination_info.total_pages.toString()}
      />
    );
  }
  const totalResults = searchResults.pagination_info?.total_records.toString();
  const totalPages = searchResults.pagination_info?.total_pages;

  return (
    <>
      <SearchResultsHeader
        queryTerm={query}
        sortby={sortby}
        totalFetchedResults={totalResults}
      />
      <div className="usa-prose">
        <div className="tablet-lg:display-flex">
          <ExportSearchResultsButton />
          <SearchPagination
            totalPages={totalPages}
            page={page}
            query={query}
            totalResults={totalResults}
          />
        </div>
        <SearchResultsList searchResults={searchResults} />
        <SearchPagination
          totalPages={totalPages}
          page={page}
          query={query}
          totalResults={totalResults}
          scroll={true}
        />
      </div>
    </>
  );
};

export default function SearchResults({
  searchParams,
  query,
  loadingMessage,
}: {
  searchParams: QueryParamData;
  query?: string | null;
  loadingMessage: string;
}) {
  const { page, sortby } = searchParams;
  const searchResultsPromise = searchForOpportunities(searchParams);
  const suspenseKey = Object.entries(searchParams).join(",");

  return (
    <Suspense
      key={suspenseKey}
      fallback={
        <SearchResultsSkeleton
          sortby={sortby}
          page={page}
          query={query}
          loadingMessage={loadingMessage}
        />
      }
    >
      <ResolvedSearchResults
        sortby={sortby}
        page={page}
        query={query}
        searchResultsPromise={searchResultsPromise}
      />
    </Suspense>
  );
}
