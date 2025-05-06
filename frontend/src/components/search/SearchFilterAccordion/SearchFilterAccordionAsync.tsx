import {
  FilterOption,
  ValidSearchQueryParam,
} from "src/types/search/searchResponseTypes";

import { SearchFilterAccordionUI } from "./SearchFilterAccordion";

export async function SearchFilterAccordion({
  filterOptions,
  title,
  queryParamKey,
  query,
  // facetCounts,
  facetKey,
  searchResultsPromise,
  defaultEmptySelection,
  includeAnyOption,
}: {
  query: Set<string>;
  queryParamKey: ValidSearchQueryParam; // Ex - In query params, search?{key}=first,second,third
  title: string; // Title in header of accordion
  filterOptions: FilterOption[];
  facetCounts?: { [key: string]: number };
  defaultEmptySelection?: Set<string>;
  includeAnyOption?: boolean;
}) {
  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults.facet_counts[facetKey];
  return (
    <SearchFilterAccordionUI
      filterOptions={filterOptions}
      title={title}
      queryParamKey={queryParamKey}
      query={query}
      facetCounts={facetCounts}
      defaultEmptySelection={defaultEmptySelection}
      includeAnyOption={includeAnyOption}
    />
  );
}
