"use client";

import { debounce } from "lodash";
import { agencySearch } from "src/services/fetch/fetchers/clientAgenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { useState } from "react";
import { TextInput } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import { AgencyFilterBody } from "./AgencyFilterBody";
import { FilterSearchNoResults } from "./FilterSearchNoResults";

export function AgencyFilterContent({
  query,
  title,
  allAgencies,
  facetCounts,
  topLevelQuery,
}: {
  query: Set<string>;
  title: string;
  allAgencies: FilterOption[];
  facetCounts: { [key: string]: number };
  topLevelQuery: Set<string>;
}) {
  const [agencySearchResults, setAgencySearchResults] =
    useState<FilterOption[]>();
  const [searchTerm, setSearchTerm] = useState<string>();
  const searchForAgencies = debounce(
    (agencySearchTerm: string) => {
      setSearchTerm(agencySearchTerm);
      if (!agencySearchTerm) {
        setAgencySearchResults(allAgencies);
        return;
      }
      agencySearch(agencySearchTerm)
        .then((searchResults) => {
          setAgencySearchResults(searchResults);
        })
        .catch((e) => {
          console.error("Error fetching agency search results", e);
          setAgencySearchResults(undefined);
        });
    },
    500,
    { leading: false, trailing: true },
  );

  return (
    <>
      <div className="position-relative">
        <TextInput
          type="text"
          name="AgencySearch"
          id="AgencySearch"
          title="Agency Search"
          aria-label="Agency Search"
          onChange={(e) => searchForAgencies(e.target.value)}
        />
        <USWDSIcon
          name="search"
          className="usa-icon--size-3 position-absolute top-05 right-05"
        />
      </div>
      {agencySearchResults && !agencySearchResults.length ? (
        <FilterSearchNoResults />
      ) : (
        <AgencyFilterBody
          query={query}
          title={title}
          includeAnyOption={!searchTerm}
          filterOptions={agencySearchResults || allAgencies}
          facetCounts={facetCounts}
          referenceOptions={allAgencies}
          topLevelQuery={topLevelQuery}
          queryParamKey={"agency"}
        />
      )}
    </>
  );
}
