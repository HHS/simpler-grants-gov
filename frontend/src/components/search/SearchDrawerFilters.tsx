import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";

import { CheckboxFilter } from "./Filters/CheckboxFilter";
import {
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "./SearchFilterAccordion/SearchFilterOptions";

export async function SearchDrawerFilters({
  searchParams,
  searchResultsPromise,
}: {
  searchParams: QueryParamData;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const { eligibility, fundingInstrument, category, status } = searchParams;

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
        filterOptions={fundingOptions}
        query={fundingInstrument}
        queryParamKey="fundingInstrument"
        title={t("accordion.titles.funding")}
        facetCounts={facetCounts?.funding_instrument || {}}
        wrapForScroll={true}
      />
      <CheckboxFilter
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        filterOptions={eligibilityOptions}
        facetCounts={facetCounts?.applicant_type || {}}
        wrapForScroll={true}
      />
      <CheckboxFilter
        filterOptions={categoryOptions}
        query={category}
        queryParamKey={"category"}
        title={t("accordion.titles.category")}
        facetCounts={facetCounts?.funding_category || {}}
        wrapForScroll={true}
      />
    </>
  );
}
