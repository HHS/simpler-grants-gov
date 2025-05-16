import {
  QueryParamData,
  SearchAPIResponse,
} from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";

import { CheckboxFilter } from "./Filters/CheckboxFilter";
import { eligibilityOptions } from "./SearchFilterAccordion/SearchFilterOptions";

export async function SearchDrawerFilters({
  searchParams,
  searchResultsPromise,
}: {
  searchParams: QueryParamData;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const { eligibility } = searchParams;

  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults?.facet_counts;

  return (
    <div className="overflow-auto border-top-1px maxh-tablet">
      <CheckboxFilter
        query={eligibility}
        queryParamKey={"eligibility"}
        title={t("accordion.titles.eligibility")}
        filterOptions={eligibilityOptions}
        facetCounts={facetCounts?.applicant_type || {}}
        wrapForScroll={true}
      />
    </div>
  );
}
