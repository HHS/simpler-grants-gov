import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import SearchPagination from "./SearchPagination";
import { SearchResultsControls } from "./SearchResultsControls/SearchResultsControls";
import { SearchResultsTable } from "./SearchResultsTable";

type SearchResultsViewProps = {
  sortby: string | null;
  page: number;
  query?: string | null;
  totalResults: string;
  totalPages: number;
  searchResults: SearchAPIResponse;
};

export const SearchResultsSkeleton = () => {
  return (
    <>
      <div>Loading the table...</div>
    </>
  );
};

export const SearchResultsView = ({
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
      <SearchResultsTable searchResults={searchResults.data} page={page} />
      <SearchPagination
        totalPages={totalPages}
        page={page}
        query={query}
        totalResults={totalResults}
        paginationClassName="flex-justify-start tablet:flex-justify-end border-top-0"
      />
    </>
  );
};
