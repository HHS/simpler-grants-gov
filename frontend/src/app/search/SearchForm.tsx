"use client";

import "./_search.scss";

import React from "react";
import SearchPagination from "../../components/search/SearchPagination";
import { SearchResponseData } from "../api/SearchOpportunityAPI";
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
        <div className="grid-row search-bar">
          <input
            className="usa-input"
            id="search-input-text"
            name="search-input"
            type="search"
            placeholder="Search a keyword"
          />
          <button className="usa-button search-submit-button" type="submit">
            Search
          </button>
        </div>

        <div className="grid-row">
          <aside className="tablet:grid-col-4">
            <fieldset className="usa-fieldset">Filters</fieldset>
          </aside>
          <main className="tablet:grid-col-8">
            <div className="grid-row search-pagination">
              <SearchPagination />
            </div>
            {/* <div className="grid-row "> */}
              <SearchResultsList searchResults={searchResults} />
            {/* </div> */}
            <div className="grid-row search-pagination">
              <SearchPagination />
            </div>
          </main>
        </div>
      </div>
    </form>
  );
}
