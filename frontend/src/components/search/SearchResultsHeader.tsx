import React from "react";
import SearchSortyBy from "./SearchSortBy";

interface SearchResultsHeaderProps {
  searchResultsLength: number;
  formRef: React.RefObject<HTMLFormElement>;
  initialSortBy: string;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  searchResultsLength,
  formRef,
  initialSortBy,
}) => {
  return (
    <>
      <div>
        <h2>{searchResultsLength} Opportunities</h2>
      </div>
      <SearchSortyBy formRef={formRef} initialSortBy={initialSortBy} />
    </>
  );
};
export default SearchResultsHeader;
