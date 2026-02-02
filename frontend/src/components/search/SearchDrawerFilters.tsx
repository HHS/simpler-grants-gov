import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";
import {
  categoryOptions,
  closeDateOptions,
  costSharingOptions,
  eligibilityOptions,
  fundingOptions,
  postedDateOptions,
  statusOptions,
} from "src/constants/searchFilterOptions";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Accordion } from "@trussworks/react-uswds";

import { CheckboxFilter } from "./Filters/CheckboxFilter";
import { RadioButtonFilter } from "./Filters/RadioButtonFilter";
import { AgencyFilterAccordion } from "./SearchFilterAccordion/AgencyFilterAccordion";
import SearchSortBy from "./SearchSortBy";

export async function SearchDrawerFilters({
  searchParams,
  searchResultsPromise,
  agencyListPromise,
}: {
  searchParams: QueryParamData;
  searchResultsPromise: Promise<SearchAPIResponse>;
  agencyListPromise: Promise<RelevantAgencyRecord[]>;
}) {
  const t = useTranslations("Search");
  const {
    eligibility,
    fundingInstrument,
    category,
    status,
    agency,
    closeDate,
    postedDate,
    costSharing,
    sortby,
    query,
    topLevelAgency,
  } = searchParams;

  const agenciesPromise = Promise.all([
    agencyListPromise,
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
      <div className="display-block tablet:display-none">
        <SearchSortBy sortby={sortby} queryTerm={query} drawer={true} />
      </div>
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
        contentClassName="overflow-visible"
      />
      <CheckboxFilter
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        filterOptions={eligibilityOptions}
        facetCounts={facetCounts?.applicant_type || {}}
        contentClassName="maxh-mobile-lg overflow-auto position-relative" // these classes allow the filter contents to scroll
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
          topLevelQuery={topLevelAgency}
          className="width-100 padding-right-5"
          selectedStatuses={Array.from(status)}
        />
      </Suspense>
      <CheckboxFilter
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
        facetCounts={facetCounts?.funding_category || {}}
        contentClassName="maxh-mobile-lg overflow-auto position-relative"
      />
      <RadioButtonFilter
        filterOptions={postedDateOptions}
        query={postedDate}
        queryParamKey={"postedDate"}
        title={t("accordion.titles.postedDate")}
        facetCounts={facetCounts?.post_date}
      />
      <RadioButtonFilter
        filterOptions={closeDateOptions}
        query={closeDate}
        queryParamKey={"closeDate"}
        title={t("accordion.titles.closeDate")}
        facetCounts={facetCounts?.close_date}
      />
      <RadioButtonFilter
        filterOptions={costSharingOptions}
        query={costSharing}
        queryParamKey={"costSharing"}
        title={t("accordion.titles.costSharing")}
        facetCounts={facetCounts?.is_cost_sharing}
      />
    </>
  );
}
