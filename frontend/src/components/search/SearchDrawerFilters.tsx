import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";
import { getAgenciesForFilterOptions } from "src/services/fetch/fetchers/agenciesFetcher";
import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Accordion } from "@trussworks/react-uswds";

import { CheckboxFilter } from "./Filters/CheckboxFilter";
import { RadioButtonFilter } from "./Filters/RadioButtonFilter";
import { AgencyFilter } from "./SearchFilterAccordion/AgencyFilterAccordion";
import {
  categoryOptions,
  closeDateOptions,
  eligibilityOptions,
  fundingOptions,
  statusOptions,
} from "./SearchFilterAccordion/SearchFilterOptions";

export async function SearchDrawerFilters({
  searchParams,
  searchResultsPromise,
}: {
  searchParams: QueryParamData;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const {
    eligibility,
    fundingInstrument,
    category,
    status,
    agency,
    closeDate,
  } = searchParams;

  const agenciesPromise = Promise.all([
    getAgenciesForFilterOptions(),
    searchResultsPromise,
  ]);

  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults?.facet_counts;

  return (
    <>
      <CheckboxFilter
        filterOptions={statusOptions}
        query={status}
        queryParamKey="status"
        title={t("accordion.titles.status")}
        defaultEmptySelection={new Set([SEARCH_NO_STATUS_VALUE])}
        facetCounts={facetCounts?.opportunity_status || {}}
      />
      <CheckboxFilter
        filterOptions={fundingOptions}
        query={fundingInstrument}
        queryParamKey="fundingInstrument"
        title={t("accordion.titles.funding")}
        facetCounts={facetCounts?.funding_instrument || {}}
      />
      <CheckboxFilter
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        filterOptions={eligibilityOptions}
        facetCounts={facetCounts?.applicant_type || {}}
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
        <AgencyFilter query={agency} agencyOptionsPromise={agenciesPromise} />
      </Suspense>
      <CheckboxFilter
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
        facetCounts={facetCounts?.funding_category || {}}
      />
      <RadioButtonFilter
        filterOptions={closeDateOptions}
        query={closeDate}
        queryParamKey={"closeDate"}
        title={t("accordion.titles.closeDate")}
        facetCounts={facetCounts?.close_date}
      />
    </>
  );
}
