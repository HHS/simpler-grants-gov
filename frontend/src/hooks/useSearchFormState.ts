"use client";

import { useRef, useState } from "react";

import { SearchAPIResponse } from "../types/search/searchResponseTypes";
import { SearchFetcherActionType } from "../types/search/searchRequestTypes";
import { SearchFetcherProps } from "../services/search/searchfetcher/SearchFetcher";
import { updateResults } from "../app/search/actions";
import { useFormState } from "react-dom";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

export function useSearchFormState(
  initialSearchResults: SearchAPIResponse,
  requestURLQueryParams: SearchFetcherProps,
) {
  const { updateQueryParams } = useSearchParamUpdater();
  const formRef = useRef<HTMLFormElement>(null);
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults, // passed down from server component page
  );

  let {
    status: statusQueryParams,
    page: pageQueryParams,
    agency: agencyQueryParams,
    fundingInstrument: fundingInstrumentQueryParams,
    query: queryQueryParams,
    sortby: sortbyQueryParams,
  } = requestURLQueryParams;
  queryQueryParams = queryQueryParams || "";
  sortbyQueryParams = sortbyQueryParams || "";

  const [page, setPage] = useState<number>(pageQueryParams || 1);
  const topPaginationRef = useRef<HTMLInputElement>(null);

  const fieldChangedRef = useRef<HTMLInputElement>(null); // hidden input that lets us know what field has just been toggled

  const handlePageChange = (handlePage: number) => {
    const setFieldChangedRef = (val: string) => {
      if (fieldChangedRef.current) {
        fieldChangedRef.current.value = val;
      }
    };

    setFieldChangedRef("pagination");
    updateQueryParams(handlePage.toString(), "page");
    if (topPaginationRef.current) {
      // Set the hidden input from SearchPagination (only needed for top SearchPagination)
      topPaginationRef.current.value = handlePage.toString();
    }
    setPage(handlePage);
    formRef.current?.requestSubmit();

    // Reset the field so when other non-page inputs are toggled,
    // we know the fieldChanged is not pagination
    // An alternative to resetting here would be to set the
    // fieldChanged for all other input handleChange/toggles
    setFieldChangedRef("");
  };

  // Function to intercept on client side before sending form inputs to server action.
  const handleSubmit = () => {
    if (fieldChangedRef.current) {
      if (fieldChangedRef.current.value !== "pagination") {
        // Always reset the page to 1
        // This is done on the API side in SearchOpportunityAPI
        setPage(1);
        updateQueryParams("", "page"); // clear page query param
      }
    }
  };

  // TODO (Issue #1517): move this to server-side calculation?
  const maxPaginationError =
    searchResults.pagination_info.total_pages > 0 &&
    searchResults.pagination_info.page_offset >
      searchResults.pagination_info.total_pages;

  const resetPagination =
    searchResults.actionType === SearchFetcherActionType.Update &&
    searchResults.fieldChanged !== "pagination";

  return {
    searchResults,
    updateSearchResultsAction,
    formRef,
    maxPaginationError,
    requestURLQueryParams,
    statusQueryParams,
    queryQueryParams,
    sortbyQueryParams,
    pageQueryParams,
    agencyQueryParams,
    fundingInstrumentQueryParams,
    fieldChangedRef,
    resetPagination,
    page,
    setPage,
    handlePageChange,
    topPaginationRef,
    handleSubmit,
  };
}
