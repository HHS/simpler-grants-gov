"use client"; // Error components must be Client Components

import {
  PaginationInfo,
  SearchAPIResponse,
} from "src/types/search/searchResponseTypes";

import PageSEO from "src/components/PageSEO";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import { SearchFetcherProps } from "src/services/search/searchfetcher/SearchFetcher";
import { SearchForm } from "src/app/search/SearchForm";
import { useEffect } from "react";

interface ErrorProps {
  // Next's error boundary also includes a reset function as a prop for retries,
  // but it was not needed as users can retry with new inputs in the normal page flow.
  error: Error & { digest?: string };
}

export interface ParsedError {
  message: string;
  searchInputs: SearchFetcherProps;
  status: number;
  type: string;
}

export default function Error({ error }: ErrorProps) {
  // The error message is passed as an object that's been stringified.
  // Parse it here.
  const parsedErrorData = JSON.parse(error.message) as ParsedError;

  const pagination_info = getErrorPaginationInfo();
  const initialSearchResults: SearchAPIResponse = getErrorInitialSearchResults(
    parsedErrorData,
    pagination_info,
  );

  // The error message search inputs had to be converted to arrays in order to be stringified,
  // convert those back to sets as we do in non-error flow.
  const convertedSearchParams = convertSearchInputArraysToSets(
    parsedErrorData.searchInputs,
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageSEO
        title="Search Funding Opportunities"
        description="Try out our experimental search page."
      />
      <SearchCallToAction />
      <SearchForm
        initialSearchResults={initialSearchResults}
        requestURLQueryParams={convertedSearchParams}
      />
    </>
  );
}

/*
 * Generate empty response data to render the full page on an error
 * which otherwise may not have any data.
 */
function getErrorInitialSearchResults(
  parsedError: ParsedError,
  pagination_info: PaginationInfo,
) {
  return {
    errors: [{ ...parsedError }],
    data: [],
    pagination_info,
    status_code: parsedError.status,
    message: parsedError.message,
  };
}

// There will be no pagination shown on an error
// so the values here just need to be valid for the page to
// load without error
function getErrorPaginationInfo() {
  return {
    order_by: "opportunity_id",
    page_offset: 0,
    page_size: 25,
    sort_direction: "ascending",
    total_pages: 1,
    total_records: 0,
  };
}

function convertSearchInputArraysToSets(
  searchInputs: SearchFetcherProps,
): SearchFetcherProps {
  return {
    ...searchInputs,
    status: new Set(searchInputs.status || []),
    fundingInstrument: new Set(searchInputs.fundingInstrument || []),
    eligibility: new Set(searchInputs.eligibility || []),
    agency: new Set(searchInputs.agency || []),
    category: new Set(searchInputs.category || []),
  };
}
