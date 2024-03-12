import React from "react";
import SearchSortyBy from "./SearchSortBy";

interface SearchResultsHeaderProps {
  searchResultsLength: number;
  formRef: React.RefObject<HTMLFormElement>;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  searchResultsLength,
  formRef,
}) => {
  return (
    <>
      <div>
        <h2>{searchResultsLength} Opportunities</h2>
      </div>
      <SearchSortyBy formRef={formRef} />
    </>
  );
};
export default SearchResultsHeader;
