"use client";

import { useEffect, useRef, useState } from "react";

import { SearchAPIResponse } from "../types/search/searchResponseTypes";
import { SearchFetcherActionType } from "../types/search/searchRequestTypes";
import { SearchFetcherProps } from "../services/search/searchfetcher/SearchFetcher";
import { updateResults } from "../app/search/actions";
import { useFormState } from "react-dom";

export function useSearchFormState(
  initialSearchResults: SearchAPIResponse,
  requestURLQueryParams: SearchFetcherProps,
) {
  const [searchResults, updateSearchResultsAction] = useFormState(
    updateResults,
    initialSearchResults, // passed down from server component page
  );

  const [fieldChanged, setFieldChanged] = useState<string>("");

  // We only set this to "pagination" in SearchPagination and clear it here.
  // Need to reset it here so when other inputs are toggled, "pagination" won't be set.
  useEffect(() => {
    setFieldChanged("");
  }, [searchResults, setFieldChanged]);

  const formRef = useRef(null);
  const queryQueryParams = requestURLQueryParams.query as string;
  const sortbyQueryParams = requestURLQueryParams.sortby as string;

  const {
    status: statusQueryParams,
    page: pageQueryParams,
    agency: agencyQueryParams,
    fundingInstrument: fundingInstrumentQueryParams,
  } = requestURLQueryParams;

  //   const updatedPageQueryParams =
  //     searchResults.actionType === SearchFetcherActionType.Update &&
  //     searchResults.fieldChanged !== "pagination"
  //       ? 1
  //       : pageQueryParams;
  //   console.log(
  //     "updatedPageQueryParams condition => ",
  //     searchResults.actionType === SearchFetcherActionType.Update &&
  //       searchResults.fieldChanged !== "pagination",
  //   );
  //   console.log("updatedPageQueryParams => ", updatedPageQueryParams);

  // TODO: move this to server-side calculation?
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
    // pageQueryParams: updatedPageQueryParams,
    pageQueryParams,
    agencyQueryParams,
    fundingInstrumentQueryParams,
    fieldChanged,
    setFieldChanged,
    resetPagination,
  };
}
