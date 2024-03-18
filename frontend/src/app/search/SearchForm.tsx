"use client";

import { ConvertedSearchParams } from "../../types/searchRequestURLTypes";
import { SearchAPIResponse } from "../../types/searchTypes";
import SearchBar from "../../components/search/SearchBar";
import SearchFilterAgency from "src/components/search/SearchFilterAgency";
import SearchFilterFundingInstrument from "../../components/search/SearchFilterFundingInstrument";
import SearchOpportunityStatus from "../../components/search/SearchOpportunityStatus";
import SearchPagination from "../../components/search/SearchPagination";
import SearchResultsHeader from "../../components/search/SearchResultsHeader";
import SearchResultsList from "../../components/search/SearchResultsList";
import { useSearchFormState } from "../../hooks/useSearchFormState";

interface SearchFormProps {
  initialSearchResults: SearchAPIResponse;
  requestURLQueryParams: ConvertedSearchParams;
}

export function SearchForm({
  initialSearchResults,
  requestURLQueryParams,
}: SearchFormProps) {
  // Capture top level logic, including useFormState in useSearhcFormState hook
  const {
    searchResults, // result of calling server action
    updateSearchResultsAction, // server action function alias
    formRef, // used in children to submit the form
    maxPaginationError,
    statusQueryParams,
    queryQueryParams,
    sortbyQueryParams,
    pageQueryParams,
    agencyQueryParams,
    fundingInstrumentQueryParams,
  } = useSearchFormState(initialSearchResults, requestURLQueryParams);

  return (
    <form ref={formRef} action={updateSearchResultsAction}>
      <div className="grid-container">
        <div className="search-bar">
          <SearchBar initialQueryParams={queryQueryParams} />
        </div>
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-4">
            <SearchOpportunityStatus
              formRef={formRef}
              initialQueryParams={statusQueryParams}
            />
            <SearchFilterFundingInstrument
              formRef={formRef}
              initialQueryParams={fundingInstrumentQueryParams}
            />
            <SearchFilterAgency
              formRef={formRef}
              initialQueryParams={agencyQueryParams}
            />
          </div>
          <div className="tablet:grid-col-8">
            <div className="usa-prose">
              <SearchResultsHeader
                formRef={formRef}
                searchResultsLength={
                  searchResults.pagination_info.total_records
                }
                initialSortBy={sortbyQueryParams}
              />
              <SearchPagination
                initialQueryParams={pageQueryParams}
                formRef={formRef}
                showHiddenInput={true}
                totalPages={searchResults.pagination_info.total_pages}
              />
              <SearchResultsList
                searchResults={searchResults.data}
                maxPaginationError={maxPaginationError}
              />
              <SearchPagination
                initialQueryParams={pageQueryParams}
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
