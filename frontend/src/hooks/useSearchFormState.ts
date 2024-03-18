"use client";

import { ConvertedSearchParams } from "../types/searchRequestURLTypes";
import { SearchAPIResponse } from "../types/searchTypes";
import { updateResults } from "../app/search/actions";
import { useFormState } from "react-dom";
import { useRef } from "react";

export function useSearchFormState(
  initialSearchResults: SearchAPIResponse,
  requestURLQueryParams: ConvertedSearchParams,
) {
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults,
  );

  const formRef = useRef(null);

  const {
    status: statusQueryParams,
    query: queryQueryParams,
    sortby: sortbyQueryParams,
    page: pageQueryParams,
    agency: agencyQueryParams,
    fundingInstrument: fundingInstrumentQueryParams,
  } = requestURLQueryParams;

  // TODO: move this to server-side calculation?
  const maxPaginationError =
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
