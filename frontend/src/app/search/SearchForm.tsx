"use client";

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

  return (
    <form action={updateSearchResultsAction}>
      <div className="grid-container">
        <div className="search-bar">
          <SearchBar />
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
