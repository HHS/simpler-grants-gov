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
    <div className="grid-row">
      <h2 className="tablet-lg:grid-col-fill margin-top-5 tablet-lg:margin-top-2 tablet-lg:margin-bottom-0">
        {searchResultsLength} Opportunities
      </h2>
      <div className="tablet-lg:grid-col-auto">
        <SearchSortyBy
          formRef={formRef}
          initialQueryParams={initialQueryParams}
        />
      </div>
    </div>
  );
};
export default SearchResultsHeader;
