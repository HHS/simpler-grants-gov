import { getAgenciesForFilterOptions } from "src/services/fetch/fetchers/agenciesFetcher";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Accordion } from "@trussworks/react-uswds";

import { SearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordionAsync";
import {
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";
import { AgencyFilterAccordion } from "./SearchFilterAccordion/AgencyFilterAccordion";
import { SearchFilterAccordionUI } from "./SearchFilterAccordion/SearchFilterAccordion";

const defaultFacetCounts = {
  funding_instrument: {},
  applicant_type: {},
  agency: {},
  funding_category: {},
  opportunity_status: {},
};

const SearchAccordionFallback = ({
  filterOptions,
  title,
  queryParamKey,
  query,
}) => (
  <SearchFilterAccordionUI
    filterOptions={filterOptions}
    title={title}
    queryParamKey={queryParamKey}
    query={query}
    facetCounts={{}}
  />
);

export default async function SearchFilters({
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
}) {
  const t = useTranslations("Search");
  // const agenciesPromise = getAgenciesForFilterOptions();

  // const facetCounts = searchResults?.facet_counts || defaultFacetCounts;

  return (
    <>
      <Suspense
        key={suspenseKey}
        fallback={
          <SearchAccordionFallback
            filterOptions={fundingOptions}
            query={fundingInstrument}
            queryParamKey="fundingInstrument"
            title={t("accordion.titles.funding")}
          />
        }
      >
        <SearchFilterAccordion
          searchResultsPromise={searchResultsPromise}
          facetKey="funding_instrument"
          filterOptions={fundingOptions}
          query={fundingInstrument}
          queryParamKey="fundingInstrument"
          title={t("accordion.titles.funding")}
          // facetCounts={facetCounts.funding_instrument || {}}
        />
      </Suspense>
      <Suspense
        key={suspenseKey}
        fallback={
          <SearchAccordionFallback
            filterOptions={eligibilityOptions}
            query={eligibility}
            queryParamKey={"eligibility"}
            title={t("accordion.titles.eligibility")}
          />
        }
      >
        <SearchFilterAccordion
          searchResultsPromise={searchResultsPromise}
          facetKey="eligibility"
          filterOptions={eligibilityOptions}
          query={eligibility}
          queryParamKey={"eligibility"}
          title={t("accordion.titles.eligibility")}
          // facetCounts={facetCounts.applicant_type || {}}
        />
      </Suspense>
      <Suspense
        key={suspenseKey}
        fallback={
          <SearchAccordionFallback
            filterOptions={categoryOptions}
            query={category}
            queryParamKey={"category"}
            title={t("accordion.titles.category")}
          />
        }
      >
        <SearchFilterAccordion
          searchResultsPromise={searchResultsPromise}
          facetKey="funding_category"
          filterOptions={categoryOptions}
          query={category}
          queryParamKey={"category"}
          title={t("accordion.titles.category")}
          // facetCounts={facetCounts.funding_category || {}}
        />
      </Suspense>
    </>
  );
}
