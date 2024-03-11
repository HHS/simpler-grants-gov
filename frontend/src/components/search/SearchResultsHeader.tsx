import React from "react";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";
import SearchSortyBy from "./SearchSortBy";

interface SearchResultsHeaderProps {
  searchResults: SearchResponseData;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  searchResults,
}) => {
  return (
    <>
      <div>
        <h2>{searchResults.length} Opportunities</h2>
      </div>
      <SearchSortyBy />
    </>
  );
};
export default SearchResultsHeader;
