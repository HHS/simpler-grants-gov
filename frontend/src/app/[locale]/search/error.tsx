"use client";

import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";
import { Breakpoints } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";
import SearchBar from "src/components/search/SearchBar";
import SearchFilters from "src/components/search/SearchFilters";

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

export default function Error({ error }: ErrorProps) {
  const t = useTranslations("Search");
  // The error message is passed as an object that's been stringified.
  // Parse it here.

  let parsedErrorData;
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
  const { agency, category, eligibility, fundingInstrument, query, status } =
    convertedSearchParams;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <div className="search-bar">
        <SearchBar query={query} />
      </div>
      <div className="grid-row grid-gap">
        <div className="tablet:grid-col-4">
          <ContentDisplayToggle
            showCallToAction={t("filterDisplayToggle.showFilters")}
            hideCallToAction={t("filterDisplayToggle.hideFilters")}
            breakpoint={Breakpoints.TABLET}
          >
            <SearchFilters
              opportunityStatus={status}
              eligibility={eligibility}
              category={category}
              fundingInstrument={fundingInstrument}
              agency={agency}
            />
          </ContentDisplayToggle>
        </div>
        <SearchErrorAlert />
      </div>
    </>
  );
}
