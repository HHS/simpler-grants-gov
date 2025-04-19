import { getAgenciesForFilterOptions } from "src/services/fetch/fetchers/agenciesFetcher";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Accordion } from "@trussworks/react-uswds";

import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import {
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";
import { AgencyFilterAccordion } from "./SearchFilterAccordion/AgencyFilterAccordion";

const defaultFacetCounts = {
  funding_instrument: {},
  applicant_type: {},
  agency: {},
  funding_category: {},
  opportunity_status: {},
};

export default async function SearchFilters({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
  searchResultsPromise,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const agenciesPromise = getAgenciesForFilterOptions();

  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults?.facet_counts || defaultFacetCounts;

  return (
    <>
      <SearchOpportunityStatus
        query={opportunityStatus}
        facetCounts={facetCounts.opportunity_status}
      />
      <SearchFilterAccordion
        filterOptions={fundingOptions}
        query={fundingInstrument}
        queryParamKey="fundingInstrument"
        title={t("accordion.titles.funding")}
        facetCounts={facetCounts.funding_instrument || {}}
      />
      <SearchFilterAccordion
        filterOptions={eligibilityOptions}
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        facetCounts={facetCounts.applicant_type || {}}
      />
      <Suspense
        fallback={
          <Accordion
            bordered={true}
            items={[
              {
                title: t("accordion.titles.agency"),
                content: [],
                expanded: false,
                id: "opportunity-filter-agency-disabled",
                headingLevel: "h2",
              },
            ]}
            multiselectable={true}
            className="margin-top-4"
          />
        }
      >
        <AgencyFilterAccordion
          query={agency}
          agencyOptionsPromise={agenciesPromise}
        />
      </Suspense>
      <SearchFilterAccordion
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
        facetCounts={facetCounts.funding_category || {}}
      />
    </>
  );
}
