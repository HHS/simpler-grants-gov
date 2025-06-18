import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { Suspense } from "react";

import { ClientSideUrlUpdater } from "src/components/ClientSideUrlUpdater";
import Loading from "src/components/Loading";
import { SearchError } from "./SearchError";
import SearchPagination from "./SearchPagination";
import SearchResultsHeader from "./SearchResultsHeader";
import { SearchResultsView } from "./SearchResultsView";

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
      <div className="search-results-content">
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
  let searchResults: SearchAPIResponse;

  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    const error = e as Error;
    return <SearchError error={error} />;
  }

  // if there are no results because we've requested a page beyond the number of total pages
  // update page to the last page to trigger a new search
  if (
    !searchResults.data.length &&
    searchResults.pagination_info.total_pages > 0 &&
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
    <SearchResultsView
      sortby={sortby}
      page={page}
      query={query}
      totalResults={totalResults}
      totalPages={totalPages}
      searchResults={searchResults}
    />
  );
};

export default function SearchResults({
  searchParams,
  loadingMessage,
  searchResultsPromise,
}: {
  searchParams: QueryParamData;
  loadingMessage: string;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const { page, sortby, query } = searchParams;
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
