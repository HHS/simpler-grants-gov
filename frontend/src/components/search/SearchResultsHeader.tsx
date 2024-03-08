import React from "react";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";

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
      <div id="search-sort-by">
        <select className="usa-select" name="sort">
          <option value="desc">Sort by posted date (descending)</option>
          <option value="asc">Sort by posted date (ascending)</option>
        </select>
      </div>
    </>
  );
};
export default SearchResultsHeader;
