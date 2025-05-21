"use client";

import { debounce } from "lodash";
import { agencySearch } from "src/services/fetch/fetchers/clientAgenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { useState } from "react";
import { TextInput } from "@trussworks/react-uswds";

import { CheckboxFilterBody } from "../Filters/CheckboxFilter";
import { FilterSearchNoResults } from "./FilterSearchNoResults";

export function AgencyFilterContent({
  query,
  title,
  agencies,
  facetCounts,
}: {
  query: Set<string>;
  title: string;
  agencies: FilterOption[];
  facetCounts: { [key: string]: number };
}) {
  const [agencySearchResults, setAgencySearchResults] =
    useState<FilterOption[]>();
  const [searchTerm, setSearchTerm] = useState<string>();
  const searchForAgencies = debounce(
    (agencySearchTerm: string) => {
      setSearchTerm(agencySearchTerm);
      agencySearch(agencySearchTerm)
        .then((searchResults) => {
          console.log("fetched agency option search", searchResults);
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
        name="LastName"
        id="LastName"
        onChange={(e) => searchForAgencies(e.target.value)}
      />
      {agencySearchResults && !agencySearchResults.length ? (
        <FilterSearchNoResults />
      ) : (
        <CheckboxFilterBody
          query={query}
          queryParamKey={"agency"}
          title={title}
          includeAnyOption={!searchTerm}
          filterOptions={agencySearchResults || agencies}
          facetCounts={facetCounts}
        />
      )}
    </>
  );
}
