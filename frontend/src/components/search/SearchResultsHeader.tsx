import React from "react";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";
import SearchSortyBy from "./SearchSortBy";

interface SearchResultsHeaderProps {
  searchResults: SearchResponseData;
}

interface SearchResultsHeaderProps {
  searchResults: SearchResponseData;
  formRef: React.RefObject<HTMLFormElement>;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  searchResults,
  formRef,
}) => {
  return (
    <>
      <div>
        <h2>{searchResults.length} Opportunities</h2>
      </div>
      <SearchSortyBy formRef={formRef} />
    </>
  );
};
export default SearchResultsHeader;
