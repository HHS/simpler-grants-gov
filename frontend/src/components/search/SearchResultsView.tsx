import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";
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
  savedOpportunities: MinimalOpportunity[];
};

// given the issues with suspense mentioned in this ticket, this won't show up
// https://github.com/HHS/simpler-grants-gov/issues/4930
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
  savedOpportunities,
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
      <SearchResultsTable
        searchResults={searchResults.data}
        page={page}
        savedOpportunities={savedOpportunities}
      />
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
