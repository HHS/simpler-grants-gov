import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { ReactNode } from "react";

import { ExportSearchResultsButton } from "./ExportSearchResultsButton";
import SearchPagination from "./SearchPagination";
import SearchResultsHeader from "./SearchResultsHeader";
import SearchResultsList from "./SearchResultsList";

type SearchResultsViewProps = {
  sortby: string | null;
  page: number;
  query?: string | null;
  totalResults: string;
  totalPages: number;
  searchResults: SearchAPIResponse;
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
          <ExportSearchResultsButton />
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

const SearchResultsTableView = () => {
  return <div>search table</div>;
};

export const SearchResultsView = withFeatureFlag<
  SearchResultsViewProps,
  ReactNode
>(SearchResultsListView, "searchTableOn", SearchResultsTableView);
