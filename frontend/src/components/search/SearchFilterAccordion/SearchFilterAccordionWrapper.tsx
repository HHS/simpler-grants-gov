import {
  BackendFilterNames,
  FilterOption,
  SearchAPIResponse,
  ValidSearchQueryParam,
} from "src/types/search/searchResponseTypes";

import { SearchFilterAccordion } from "./SearchFilterAccordion";

export async function SearchFilterAccordionWrapper({
  filterOptions,
  title,
  queryParamKey,
  query,
  facetKey,
  searchResultsPromise,
  defaultEmptySelection,
  includeAnyOption,
}: {
  query: Set<string>;
  queryParamKey: ValidSearchQueryParam; // Ex - In query params, search?{key}=first,second,third
  title: string; // Title in header of accordion
  filterOptions: FilterOption[];
  defaultEmptySelection?: Set<string>;
  includeAnyOption?: boolean;
  searchResultsPromise: Promise<SearchAPIResponse>;
  facetKey: BackendFilterNames;
}) {
  let searchResults;
  try {
    searchResults = await searchResultsPromise;
  } catch (e) {
    console.error("Search error, cannot set filter facets", e);
  }

  const facetCounts = searchResults?.facet_counts[facetKey] || {};
  return (
    <SearchFilterAccordion
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
