"use client";

import SearchSortyBy from "./SearchSortBy";

interface SearchResultsHeaderProps {
  searchResultsLength: number;
  formRef: React.RefObject<HTMLFormElement>;
  initialQueryParams: string;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  searchResultsLength,
  formRef,
  initialQueryParams,
}) => {
  return (
    <>
      <div>
        <h2>{searchResultsLength} Opportunities</h2>
      </div>
      <SearchSortyBy formRef={formRef} initialQueryParams={initialQueryParams} />
    </>
  );
};
export default SearchResultsHeader;
