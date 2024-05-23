"use client"; // Error components must be Client Components

import {
  PaginationInfo,
  SearchAPIResponse,
} from "src/types/search/searchResponseTypes";

import PageSEO from "src/components/PageSEO";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import { SearchForm } from "src/app/[locale]/search/SearchForm";
import { useEffect } from "react";

interface ErrorProps {
  // Next's error boundary also includes a reset function as a prop for retries,
  // but it was not needed as users can retry with new inputs in the normal page flow.
  error: Error & { digest?: string };
}

export interface ParsedError {
  message: string;
  searchInputs: QueryParamData;
  status: number;
  type: string;
}

export default function Error({ error }: ErrorProps) {
  // The error message is passed as an object that's been stringified.
  // Parse it here.

  let parsedErrorData;
  const pagination_info = getErrorPaginationInfo();
  let convertedSearchParams;
  if (!isValidJSON(error.message)) {
    // the error likely is just a string with a non-specific Server Component error when running the built app
    // "An error occurred in the Server Components render. The specific message is omitted in production builds..."
    parsedErrorData = getParsedError();
    convertedSearchParams = parsedErrorData.searchInputs;
  } else {
    // Valid error thrown from server component
    parsedErrorData = JSON.parse(error.message) as ParsedError;

    // The error message search inputs had to be converted to arrays in order to be stringified,
    // convert those back to sets as we do in non-error flow.
    convertedSearchParams = convertSearchInputArraysToSets(
      parsedErrorData.searchInputs,
    );
  }

  const initialSearchResults: SearchAPIResponse = getErrorInitialSearchResults(
    pagination_info,
    parsedErrorData,
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
  pagination_info: PaginationInfo,
  parsedError: ParsedError,
) {
  return {
    errors: parsedError ? [{ ...parsedError }] : [{}],
    data: [],
    pagination_info,
    status_code: parsedError?.status || -1,
    message: parsedError?.message || "Unable to parse thrown error",
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
  searchInputs: QueryParamData,
): QueryParamData {
  return {
    ...searchInputs,
    status: new Set(searchInputs.status || []),
    fundingInstrument: new Set(searchInputs.fundingInstrument || []),
    eligibility: new Set(searchInputs.eligibility || []),
    agency: new Set(searchInputs.agency || []),
    category: new Set(searchInputs.category || []),
  };
}

function isValidJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false; // String is not valid JSON
  }
}

function getParsedError() {
  return {
    type: "NetworkError",
    searchInputs: {
      status: new Set(),
      fundingInstrument: new Set(),
      eligibility: new Set(),
      agency: new Set(),
      category: new Set(),
      sortby: null,
      page: 1,
      actionType: "initialLoad",
    },
    message: "Invalid JSON returned",
    status: -1,
  } as ParsedError;
}
