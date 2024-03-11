"use client";

import { usePathname, useSearchParams } from "next/navigation";

import React from "react";
import SearchBar from "../../components/search/SearchBar";
import SearchOpportunityStatus from "../../components/search/SearchOpportunityStatus";
import SearchPagination from "../../components/search/SearchPagination";
import { SearchResponseData } from "../api/SearchOpportunityAPI";
import SearchResultsHeader from "../../components/search/SearchResultsHeader";
import SearchResultsList from "../../components/search/SearchResultsList";
import { updateResults } from "./actions";
import { useFormState } from "react-dom";

interface SearchFormProps {
  initialSearchResults: SearchResponseData;
}

export function SearchForm({ initialSearchResults }: SearchFormProps) {
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams || {});
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    if (pathname) {
      const newPath = `${pathname}?${params.toString()}`;

      // Cannot use replace or push from `useRouter` since that
      // will cause a page refresh (which calls the server page code again).
      // Using the native browser's History API does not cause a refresh.
      window.history.pushState({}, "", newPath);
    }
  };

  return (
    <form action={updateSearchResultsAction}>
      <div className="grid-container">
        <div className="search-bar">
          <SearchBar handleSearch={handleSearch} />
        </div>
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-4">
            <SearchOpportunityStatus />
            <fieldset className="usa-fieldset">Filters</fieldset>
          </div>
          <div className="tablet:grid-col-8">
            <div className="usa-prose">
              <SearchResultsHeader searchResults={searchResults} />
              <SearchPagination />
              <SearchResultsList searchResults={searchResults} />
              <SearchPagination />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
