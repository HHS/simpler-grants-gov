import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";
import {
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
  statusOptions,
} from "src/constants/searchFilterOptions";
import { obtainAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { CheckboxFilter } from "./Filters/CheckboxFilter";
import { AgencyFilterAccordion } from "./SearchFilterAccordion/AgencyFilterAccordion";

export default async function SearchFilters({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
  topLevelAgency,
  searchResultsPromise,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
  topLevelAgency: Set<string>;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const agenciesPromise = Promise.all([obtainAgencies(), searchResultsPromise]);

  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults?.facet_counts;

  return (
    <>
      <SearchFilterAccordion
        filterOptions={statusOptions}
        query={opportunityStatus}
        queryParamKey="status"
        title={t("accordion.titles.status")}
        defaultEmptySelection={new Set([SEARCH_NO_STATUS_VALUE])}
        facetCounts={facetCounts?.opportunity_status || {}}
      />
      <SearchFilterAccordion
        filterOptions={fundingOptions}
        query={fundingInstrument}
        queryParamKey="fundingInstrument"
        title={t("accordion.titles.funding")}
        facetCounts={facetCounts?.funding_instrument || {}}
        contentClassName="overflow-visible"
      />
      <SearchFilterAccordion
        filterOptions={eligibilityOptions}
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        facetCounts={facetCounts?.applicant_type || {}}
      />
      <Suspense
        fallback={
          <CheckboxFilter
            filterOptions={[]}
            query={agency}
            queryParamKey={"agency"}
            title={t("accordion.titles.agency")}
            facetCounts={{}}
          />
        }
      >
        <AgencyFilterAccordion
          query={agency}
          agencyOptionsPromise={agenciesPromise}
          topLevelQuery={topLevelAgency}
        />
      </Suspense>
      <SearchFilterAccordion
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
        facetCounts={facetCounts?.funding_category || {}}
      />
    </>
  );
}
