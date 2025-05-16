import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";

import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export async function AgencyFilterAccordion({
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
    <SearchFilterAccordion
      filterOptions={agencies}
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
      wrapForScroll={true}
      facetCounts={facetCounts}
    />
  );
}
