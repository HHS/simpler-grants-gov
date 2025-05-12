import {
  FilterOption,
  SearchAPIResponse,
} from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";

import { SearchFilterAccordionWrapper } from "./SearchFilterAccordionWrapper";

// functionality differs depending on whether `agencyOptions` or `agencyOptionsPromise` is passed
// with prefetched options we have a synchronous render
// with a Promise we have an async render with Suspense
export async function AgencyFilterAccordion({
  query,
  agencyOptionsPromise,
  searchResultsPromise,
}: {
  query: Set<string>;
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
  return (
    <SearchFilterAccordionWrapper
      filterOptions={agencies}
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
      includeAnyOption={false}
      searchResultsPromise={searchResultsPromise}
      facetKey="agency"
    />
  );
}
