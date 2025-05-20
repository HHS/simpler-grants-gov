import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { CheckboxFilterBody } from "../Filters/CheckboxFilter";

export async function AgencyFilterContent({
  query,
  title,
  searchResultsPromise,
  agencySearchPromise,
}) {
  let agencies: FilterOption[] = [];
  let facetCounts: { [key: string]: number } = {};
  try {
    let searchResults: SearchAPIResponse;
    [agencies, searchResults] = await Promise.all([
      agencySearchPromise,
      searchResultsPromise,
    ]);
    facetCounts = searchResults.facet_counts.agency;
  } catch (e) {
    // Come back to this to show the user an error
    console.error("Unable to fetch agencies for filter list", e);
  }
  return (
    <CheckboxFilterBody
      query={query}
      queryParamKey={"agency"}
      title={title}
      includeAnyOption={true}
      filterOptions={agencies}
      facetCounts={facetCounts}
    />
  );
}
