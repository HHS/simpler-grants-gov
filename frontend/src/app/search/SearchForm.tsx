"use client";

import React, { useRef } from "react";

import { ConvertedSearchParams } from "../../types/requestURLTypes";
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
  requestURLQueryParams: ConvertedSearchParams;
}

export function SearchForm({
  initialSearchResults,
  requestURLQueryParams,
}: SearchFormProps) {
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  const formRef = useRef(null); // allows us to submit form from child components

  const { status, query, sortby } = requestURLQueryParams;

  return (
    <form ref={formRef} action={updateSearchResultsAction}>
      <div className="grid-container">
        <div className="search-bar">
          <SearchBar initialQuery={query} />
        </div>
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-4">
            <SearchOpportunityStatus
              formRef={formRef}
              initialStatuses={status}
            />
            <fieldset className="usa-fieldset">Filters</fieldset>
          </div>
          <div className="tablet:grid-col-8">
            <div className="usa-prose">
              <SearchResultsHeader
                formRef={formRef}
                searchResultsLength={searchResults.length}
                initialSortBy={sortby}
              />
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
