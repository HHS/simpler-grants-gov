"use client";

import SearchPagination, {
  PaginationPosition,
} from "../../components/search/SearchPagination";

import { AgencyNamyLookup } from "src/utils/search/generateAgencyNameLookup";
import { SearchAPIResponse } from "../../types/search/searchResponseTypes";
import SearchBar from "../../components/search/SearchBar";
import { SearchFetcherProps } from "../../services/search/searchfetcher/SearchFetcher";
import SearchFilterAgency from "src/components/search/SearchFilterAgency";
import SearchFilterCategory from "../../components/search/SearchFilterCategory";
import SearchFilterEligibility from "../../components/search/SearchFilterEligibility";
import SearchFilterFundingInstrument from "../../components/search/SearchFilterFundingInstrument";
import SearchOpportunityStatus from "../../components/search/SearchOpportunityStatus";
import SearchResultsHeader from "../../components/search/SearchResultsHeader";
import SearchResultsList from "../../components/search/SearchResultsList";
import { useSearchFormState } from "../../hooks/useSearchFormState";

interface SearchFormProps {
  initialSearchResults: SearchAPIResponse;
  requestURLQueryParams: SearchFetcherProps;
  agencyNameLookup?: AgencyNamyLookup;
}

export function SearchForm({
  initialSearchResults,
  requestURLQueryParams,
  agencyNameLookup,
}: SearchFormProps) {
  // Capture top level logic, including useFormState in the useSearchFormState hook
  const {
    searchResults, // result of calling server action
    updateSearchResultsAction, // server action function alias
    formRef, // used in children to submit the form
    statusQueryParams,
    queryQueryParams,
    sortbyQueryParams,
    fundingInstrumentQueryParams,
    eligibilityQueryParams,
    agencyQueryParams,
    categoryQueryParams,
    maxPaginationError,
    fieldChangedRef,
    page,
    handlePageChange,
    topPaginationRef,
    handleSubmit,
  } = useSearchFormState(initialSearchResults, requestURLQueryParams);

  return (
    <form
      ref={formRef}
      action={updateSearchResultsAction}
      onSubmit={handleSubmit}
    >
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
            <SearchFilterEligibility
              formRef={formRef}
              initialQueryParams={eligibilityQueryParams}
            />
            <SearchFilterAgency
              formRef={formRef}
              initialQueryParams={agencyQueryParams}
            />
            <SearchFilterCategory
              formRef={formRef}
              initialQueryParams={categoryQueryParams}
            />
          </div>
          <div className="tablet:grid-col-8">
            <SearchResultsHeader
              formRef={formRef}
              searchResultsLength={
                searchResults?.pagination_info?.total_records
              }
              initialQueryParams={sortbyQueryParams}
            />
            <div className="usa-prose">
              <SearchPagination
                totalPages={searchResults?.pagination_info?.total_pages}
                page={page}
                handlePageChange={handlePageChange}
                showHiddenInput={true}
                paginationRef={topPaginationRef}
                searchResultsLength={searchResults.data.length}
              />

              <SearchResultsList
                searchResults={searchResults?.data}
                maxPaginationError={maxPaginationError}
                agencyNameLookup={agencyNameLookup}
                errors={searchResults.errors}
              />

              <SearchPagination
                totalPages={searchResults?.pagination_info?.total_pages}
                page={page}
                handlePageChange={handlePageChange}
                searchResultsLength={searchResults.data.length}
              />
            </div>
          </div>
        </div>
      </div>
      <input type="hidden" name="fieldChanged" ref={fieldChangedRef} />
    </form>
  );
}
