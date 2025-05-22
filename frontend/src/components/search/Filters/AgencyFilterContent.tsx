"use client";

import { debounce } from "lodash";
import { agencySearch } from "src/services/fetch/fetchers/clientAgenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { useState } from "react";
import { TextInput } from "@trussworks/react-uswds";

import { CheckboxFilterBody } from "src/components/search/Filters/CheckboxFilter";
import { USWDSIcon } from "src/components/USWDSIcon";
import { FilterSearchNoResults } from "./FilterSearchNoResults";

export function AgencyFilterContent({
  query,
  title,
  allAgencies,
  facetCounts,
}: {
  query: Set<string>;
  title: string;
  allAgencies: FilterOption[];
  facetCounts: { [key: string]: number };
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
      <TextInput
        type="text"
        name="AgencySearch"
        id="AgencySearch"
        title="Agency Search"
        aria-label="Agency Search"
        onChange={(e) => searchForAgencies(e.target.value)}
      />
      <div className="usa-input position-absolute top-0 border-0">
        <USWDSIcon name="search" className="usa-icon--size-3" />
      </div>
      {agencySearchResults && !agencySearchResults.length ? (
        <FilterSearchNoResults />
      ) : (
        <CheckboxFilterBody
          query={query}
          queryParamKey={"agency"}
          title={title}
          includeAnyOption={!searchTerm}
          filterOptions={agencySearchResults || allAgencies}
          facetCounts={facetCounts}
          referenceOptions={allAgencies}
        />
      )}
    </>
  );
}
