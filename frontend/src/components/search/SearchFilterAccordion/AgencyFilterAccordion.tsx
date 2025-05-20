import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";

import { BasicSearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { AgencyFilterContent } from "../Filters/AgencyFilterContent";

export async function AgencyFilterAccordion({
  query,
  agenciesPromise,
}: {
  query: Set<string>;
  agenciesPromise: Promise<[FilterOption[], SearchAPIResponse]>;
}) {
  const t = useTranslations("Search");

  let agencies: FilterOption[] = [];
  let facetCounts: { [key: string]: number } = {};
  try {
    let searchResults: SearchAPIResponse;
    [agencies, searchResults] = await agenciesPromise;
    facetCounts = searchResults.facet_counts.agency;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
  }

  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
    >
      <AgencyFilterContent
        query={query}
        title={t("accordion.titles.agency")}
        agencies={agencies}
        facetCounts={facetCounts}
      />
    </BasicSearchFilterAccordion>
  );
}

export async function AgencyFilter({
  query,
  agencyOptionsPromise,
}: {
  query: Set<string>;
  agencyOptionsPromise: Promise<[FilterOption[], SearchAPIResponse]>;
}) {
  const t = useTranslations("Search");

  let agencies: FilterOption[] = [];
  let facetCounts: { [key: string]: number } = {};
  try {
    let searchResults: SearchAPIResponse;
    [agencies, searchResults] = await agencyOptionsPromise;
    facetCounts = searchResults.facet_counts.agency;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
  }
  return (
    <CheckboxFilter
      filterOptions={agencies}
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
      facetCounts={facetCounts}
    />
  );
}
