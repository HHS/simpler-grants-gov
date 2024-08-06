"use client"; // Error components must be Client Components
import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import PageSEO from "src/components/PageSEO";
import QueryProvider from "src/app/[locale]/search/QueryProvider";
import SearchBar from "src/components/search/SearchBar";
import SearchCallToAction from "src/components/search/SearchCallToAction";
import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";
import SearchResultsHeader from "src/components/search/SearchResultsHeader";
import {
  agencyOptions,
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import { SEARCH_CRUMBS } from "src/constants/breadcrumbs";
import { QueryParamData } from "src/services/search/searchfetcher/SearchFetcher";
import { useEffect } from "react";
import SearchErrorAlert from "src/components/search/error/SearchErrorAlert";

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
  const {
    agency,
    category,
    eligibility,
    fundingInstrument,
    query,
    sortby,
    status,
  } = convertedSearchParams;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageSEO
        title="Search Funding Opportunities"
        description="Try out our experimental search page."
      />
      <BetaAlert />
      <Breadcrumbs breadcrumbList={SEARCH_CRUMBS} />
      <SearchCallToAction />
      <QueryProvider>
        <div className="grid-container">
          <div className="search-bar">
            <SearchBar query={query} />
          </div>
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-4">
              <SearchOpportunityStatus query={status} />
              <SearchFilterAccordion
                filterOptions={fundingOptions}
                title="Funding instrument"
                queryParamKey="fundingInstrument"
                query={fundingInstrument}
              />
              <SearchFilterAccordion
                filterOptions={eligibilityOptions}
                title="Eligibility"
                queryParamKey="eligibility"
                query={eligibility}
              />
              <SearchFilterAccordion
                filterOptions={agencyOptions}
                title="Agency"
                queryParamKey="agency"
                query={agency}
              />
              <SearchFilterAccordion
                filterOptions={categoryOptions}
                title="Category"
                queryParamKey="category"
                query={category}
              />
            </div>
            <div className="tablet:grid-col-8">
              <SearchResultsHeader sortby={sortby} />
              <div className="usa-prose">
                <SearchErrorAlert />
              </div>
            </div>
          </div>
        </div>
      </QueryProvider>
    </>
  );
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
