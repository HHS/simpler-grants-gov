import {
  FilterOption,
  SearchAPIResponse,
} from "src/types/search/searchResponseTypes";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SearchFilterAccordion } from "./SearchFilterAccordion";
import { SearchFilterAccordionWrapper } from "./SearchFilterAccordionWrapper";

export async function AgencyFilterAccordion({
  query,
  // searchSuspenseKey,
  agencyOptionsPromise,
  // searchResultsPromise,
}: {
  query: Set<string>;
  // searchSuspenseKey: string;
  agencyOptionsPromise: Promise<FilterOption[]>;
  // searchResultsPromise: Promise<SearchAPIResponse>;
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
    <SearchFilterAccordion
      filterOptions={agencies}
      title={t("accordion.titles.agency")}
      queryParamKey={"agency"}
      query={query}
    />
  );
}
