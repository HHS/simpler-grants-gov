"use client";

import "./_search.scss";

import { useFormState, useFormStatus } from "react-dom";

import Loading from "./loading";
import React from "react";
import { SearchResponseData } from "../api/SearchOpportunityAPI";
import { updateResults } from "./actions";

interface SearchResultsListProps {
  searchResults: SearchResponseData;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
}) => {
  const { pending } = useFormStatus();

  if (pending) {
    return <Loading />;
  }

  return (
    <>
      <h4>{searchResults.length} Opportunities</h4>
      <ul className="search-results-list">
        {searchResults.map((opportunity) => (
          <li key={opportunity.opportunity_id}>
            {opportunity.category}, {opportunity.opportunity_title}
          </li>
        ))}
      </ul>
    </>
  );
};

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
          {" "}
          {/* Flex container */}
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

        <div className="grid-row grid-gap">
          <aside className="tablet:grid-col-4">
            <fieldset className="usa-fieldset">Filters</fieldset>
          </aside>
          <main className="tablet:grid-col-8">
            <SearchResultsList searchResults={searchResults} />

            {/* Pagination */}
          </main>
        </div>
      </div>
    </form>
  );
}
