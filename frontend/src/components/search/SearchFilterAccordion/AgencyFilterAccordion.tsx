import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";
import { agenciesToSortedAndNestedFilterOptions } from "src/utils/search/filterUtils";

import { useTranslations } from "next-intl";

import { AgencyFilterContent } from "src/components/search/Filters/AgencyFilterContent";
import { BasicSearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

export async function AgencyFilterAccordion({
  query,
  agencyOptionsPromise,
  topLevelQuery,
  className,
  selectedStatuses,
}: {
  query: Set<string>;
  agencyOptionsPromise: Promise<[RelevantAgencyRecord[], SearchAPIResponse]>;
  topLevelQuery: Set<string>;
  className?: string;
  selectedStatuses?: string[];
}) {
  const t = useTranslations("Search");

  let allAgencies: RelevantAgencyRecord[] = [];
  let facetCounts: { [key: string]: number } = {};
  try {
    let searchResults: SearchAPIResponse;
    [allAgencies, searchResults] = await agencyOptionsPromise;
    facetCounts = searchResults.facet_counts.agency;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
  }

  const agencyOptions = agenciesToSortedAndNestedFilterOptions(allAgencies);

  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
      className={className}
      contentClassName="maxh-mobile-lg overflow-auto position-relative"
    >
      <AgencyFilterContent
        query={query}
        title={t("accordion.titles.agency")}
        allAgencies={agencyOptions}
        facetCounts={facetCounts}
        topLevelQuery={topLevelQuery}
        selectedStatuses={selectedStatuses}
      />
    </BasicSearchFilterAccordion>
  );
}
