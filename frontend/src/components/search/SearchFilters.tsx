import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";
import { getAgenciesForFilterOptions } from "src/services/fetch/fetchers/agenciesFetcher";
import { OptionalStringDict } from "src/types/generalTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SearchFilterAccordionWrapper } from "src/components/search/SearchFilterAccordion/SearchFilterAccordionWrapper";
import {
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
  statusOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import { AgencyFilterAccordion } from "./SearchFilterAccordion/AgencyFilterAccordion";
import { SearchFilterAccordion } from "./SearchFilterAccordion/SearchFilterAccordion";

export default function SearchFilters({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
  searchResultsPromise,
  searchParams,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
  searchResultsPromise: Promise<SearchAPIResponse>;
  searchParams: OptionalStringDict;
}) {
  const t = useTranslations("Search");
  const agenciesPromise = getAgenciesForFilterOptions();

  const searchSuspenseKey = JSON.stringify(searchParams);
  return (
    <>
      <SearchFilterList
        opportunityStatus={opportunityStatus}
        eligibility={eligibility}
        category={category}
        fundingInstrument={fundingInstrument}
        agency={agency}
        searchResultsPromise={searchResultsPromise}
        suspenseKey={searchSuspenseKey}
      />
      <Suspense
        key={`${JSON.stringify(searchParams.status)}-agency`}
        fallback={
          <SearchFilterAccordion
            filterOptions={[]}
            query={agency}
            queryParamKey="agency"
            title={t("accordion.titles.agency")}
          />
        }
      >
        <AgencyFilterAccordion
          query={agency}
          agencyOptionsPromise={agenciesPromise}
          // searchResultsPromise={searchResultsPromise}
          // searchResultsPromise={Promise.resolve({})}
          // searchSuspenseKey={`${suspenseKey}-agency-facets`}
        />
      </Suspense>
    </>
  );
}

export function SearchFilterList({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
  searchResultsPromise,
  suspenseKey,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
  searchResultsPromise: Promise<SearchAPIResponse>;
  suspenseKey: string;
}) {
  const t = useTranslations("Search");

  return (
    <>
      <Suspense
        key={`${suspenseKey}-status`}
        fallback={
          <SearchFilterAccordion
            filterOptions={statusOptions}
            query={opportunityStatus}
            queryParamKey="status"
            title={t("accordion.titles.status")}
          />
        }
      >
        <SearchFilterAccordionWrapper
          searchResultsPromise={searchResultsPromise}
          facetKey="opportunity_status"
          filterOptions={statusOptions}
          query={opportunityStatus}
          queryParamKey="status"
          title={t("accordion.titles.status")}
          defaultEmptySelection={new Set([SEARCH_NO_STATUS_VALUE])}
        />
      </Suspense>
      <Suspense
        key={`${suspenseKey}-fundingInstrument`}
        fallback={
          <SearchFilterAccordion
            filterOptions={fundingOptions}
            query={fundingInstrument}
            queryParamKey="fundingInstrument"
            title={t("accordion.titles.funding")}
          />
        }
      >
        <SearchFilterAccordionWrapper
          searchResultsPromise={searchResultsPromise}
          facetKey="funding_instrument"
          filterOptions={fundingOptions}
          query={fundingInstrument}
          queryParamKey="fundingInstrument"
          title={t("accordion.titles.funding")}
        />
      </Suspense>
      <Suspense
        key={`${suspenseKey}-eligibility`}
        fallback={
          <SearchFilterAccordion
            filterOptions={eligibilityOptions}
            query={eligibility}
            queryParamKey={"eligibility"}
            title={t("accordion.titles.eligibility")}
          />
        }
      >
        <SearchFilterAccordionWrapper
          searchResultsPromise={searchResultsPromise}
          facetKey="applicant_type"
          filterOptions={eligibilityOptions}
          query={eligibility}
          queryParamKey={"eligibility"}
          title={t("accordion.titles.eligibility")}
        />
      </Suspense>
      <Suspense
        key={`${suspenseKey}-category`}
        fallback={
          <SearchFilterAccordion
            filterOptions={categoryOptions}
            query={category}
            queryParamKey={"category"}
            title={t("accordion.titles.category")}
          />
        }
      >
        <SearchFilterAccordionWrapper
          searchResultsPromise={searchResultsPromise}
          facetKey="funding_category"
          filterOptions={categoryOptions}
          query={category}
          queryParamKey={"category"}
          title={t("accordion.titles.category")}
        />
      </Suspense>
    </>
  );
}
