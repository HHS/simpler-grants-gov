import {
  FilterOption,
  SearchAPIResponse,
} from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SearchFilterAccordion } from "./SearchFilterAccordion";
import { SearchFilterAccordionWrapper } from "./SearchFilterAccordionWrapper";

// export function AgencyFilterAccordionSkeleton() {
//   <AgencyFilterAccordion
//     query={agency}
//     agencyOptionsPromise={agenciesPromise}
//     searchResultsPromise={searchResultsPromise}
//   />;
// }

// functionality differs depending on whether `agencyOptions` or `agencyOptionsPromise` is passed
// with prefetched options we have a synchronous render
// with a Promise we have an async render with Suspense
export async function AgencyFilterAccordion({
  query,
  searchSuspenseKey,
  agencyOptionsPromise,
  searchResultsPromise,
}: {
  query: Set<string>;
  searchSuspenseKey: string;
  agencyOptionsPromise: Promise<FilterOption[]>;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");

  let agencies: FilterOption[] = [];

  try {
    agencies = await agencyOptionsPromise;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
  }
  console.log("!!!", searchSuspenseKey);
  return (
    <Suspense
      key={searchSuspenseKey}
      fallback={
        <SearchFilterAccordion
          filterOptions={agencies}
          query={query}
          queryParamKey="agency"
          title={t("accordion.titles.agency")}
          includeAnyOption={false}
        />
      }
    >
      <SearchFilterAccordionWrapper
        filterOptions={agencies}
        query={query}
        queryParamKey={"agency"}
        title={t("accordion.titles.agency")}
        includeAnyOption={false}
        searchResultsPromise={searchResultsPromise}
        facetKey="agency"
      />
    </Suspense>
  );
}
