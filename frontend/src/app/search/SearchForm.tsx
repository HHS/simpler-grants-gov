"use client";

import "./_search.scss";

import React from "react";
import SearchBar from "../../components/search/SearchBar";
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
  const [searchResults, updateSearchResultAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  return (
    <form action={updateSearchResultAction}>
      <div className="grid-container">
        <div className="search-bar">
          <SearchBar />
        </div>

        <div className="grid-row">
          <aside className="tablet:grid-col-4">
            <fieldset className="usa-fieldset">Filters</fieldset>
          </aside>
          <main className="tablet:grid-col-8">
            <div className="grid-row" id="search-results-header">
              <SearchResultsHeader searchResults={searchResults} />
            </div>
            <div className="search-pagination">
              <SearchPagination />
            </div>
            <div id="search-results-list">
              <SearchResultsList searchResults={searchResults} />
            </div>
            <div className="search-pagination">
              <SearchPagination />
            </div>
          </main>
        </div>
      </div>
    </form>
  );
}
