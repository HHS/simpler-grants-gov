"use client";

import React, { useRef } from "react";

import { ConvertedSearchParams } from "../../types/requestURLTypes";
import { SearchAPIResponse } from "../../types/searchTypes";
import SearchBar from "../../components/search/SearchBar";
import SearchFundingOpportunity from "../../components/search/SearchFundingOpportunity";
import SearchOpportunityStatus from "../../components/search/SearchOpportunityStatus";
import SearchPagination from "../../components/search/SearchPagination";
import SearchResultsHeader from "../../components/search/SearchResultsHeader";
import SearchResultsList from "../../components/search/SearchResultsList";
import { updateResults } from "./actions";
import { useFormState } from "react-dom";

interface SearchFormProps {
  initialSearchResults: SearchAPIResponse;
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

  const { status, query, sortby, page } = requestURLQueryParams;

  // TODO: move this to server-side calculation?
  const maxPaginationError =
    searchResults.pagination_info.page_offset >
    searchResults.pagination_info.total_pages;

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
            <SearchFundingOpportunity />
          </div>
          <div className="tablet:grid-col-8">
            <div className="usa-prose">
              <SearchResultsHeader
                formRef={formRef}
                searchResultsLength={
                  searchResults.pagination_info.total_records
                }
                initialSortBy={sortby}
              />
              <SearchPagination
                page={page}
                formRef={formRef}
                showHiddenInput={true}
                totalPages={searchResults.pagination_info.total_pages}
              />
              <SearchResultsList
                searchResults={searchResults.data}
                maxPaginationError={maxPaginationError}
              />
              <SearchPagination
                page={page}
                formRef={formRef}
                totalPages={searchResults.pagination_info.total_pages}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
