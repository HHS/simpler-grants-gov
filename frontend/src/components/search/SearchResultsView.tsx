import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { ReactNode } from "react";

import Loading from "src/components/Loading";
import { ExportSearchResultsButton } from "./ExportSearchResultsButton";
import SearchPagination from "./SearchPagination";
import { SearchResultsControls } from "./SearchResultsControls/SearchResultsControls";
import SearchResultsHeader from "./SearchResultsHeader";
import SearchResultsList from "./SearchResultsList";
import { SearchResultsTable } from "./SearchResultsTable";

type SearchResultsViewProps = {
  sortby: string | null;
  page: number;
  query?: string | null;
  totalResults: string;
  totalPages: number;
  searchResults: SearchAPIResponse;
};

type SearchResultsSkeletonProps = {
  sortby: string | null;
  page: number;
  query?: string | null;
  loadingMessage: string;
};

const SearchResultsLegacySkeleton = ({
  sortby,
  page,
  query,
  loadingMessage,
}: SearchResultsSkeletonProps) => {
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

const SearchResultsTableSkeleton = ({
  sortby,
  page,
  query,
  loadingMessage,
}: SearchResultsSkeletonProps) => {
  return (
    <>
      <div>Loading the table...</div>
    </>
  );
};

const SearchResultsListView = ({
  sortby,
  page,
  query,
  totalResults,
  totalPages,
  searchResults,
}: SearchResultsViewProps) => {
  return (
    <>
      <SearchResultsHeader
        queryTerm={query}
        sortby={sortby}
        totalFetchedResults={totalResults}
      />
      <div className="search-results-content">
        <div className="tablet-lg:display-flex">
          <ExportSearchResultsButton className="desktop:grid-col-4 desktop:display-flex flex-align-self-center" />
          <SearchPagination
            totalPages={totalPages}
            page={page}
            query={query}
            totalResults={totalResults}
          />
        </div>
        <SearchResultsList searchResults={searchResults} page={page} />
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

const SearchResultsTableView = ({
  sortby,
  page,
  query,
  totalResults,
  totalPages,
  searchResults,
}: SearchResultsViewProps) => {
  return (
    <>
      <SearchResultsControls
        sortby={sortby}
        page={page}
        query={query}
        totalResults={totalResults}
        totalPages={totalPages}
      />
      <SearchResultsTable searchResults={searchResults.data} />
    </>
  );
};

export const SearchResultsView = withFeatureFlag<
  SearchResultsViewProps,
  ReactNode
>(SearchResultsListView, "searchTableOn", SearchResultsTableView);

export const SearchResultsSkeleton = withFeatureFlag<
  SearchResultsSkeletonProps,
  ReactNode
>(SearchResultsLegacySkeleton, "searchTableOn", SearchResultsTableSkeleton);
