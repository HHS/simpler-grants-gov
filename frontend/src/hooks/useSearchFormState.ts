"use client";

import { SearchAPIResponse } from "../types/search/searchResponseTypes";
import { SearchFetcherProps } from "../services/search/searchfetcher/SearchFetcher";
import { updateResults } from "../app/search/actions";
import { useFormState } from "react-dom";
import { useRef } from "react";

export function useSearchFormState(
  initialSearchResults: SearchAPIResponse,
  requestURLQueryParams: SearchFetcherProps,
) {
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  const formRef = useRef(null);
  const queryQueryParams = requestURLQueryParams.query as string;
  const sortbyQueryParams = requestURLQueryParams.sortby as string;

  const {
    status: statusQueryParams,
    page: pageQueryParams,
    agency: agencyQueryParams,
    fundingInstrument: fundingInstrumentQueryParams,
  } = requestURLQueryParams;

  // TODO: move this to server-side calculation?
  const maxPaginationError =
    searchResults.pagination_info.total_pages > 0 &&
    searchResults.pagination_info.page_offset >
      searchResults.pagination_info.total_pages;

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
  };
}
