"use client";

import { debounce, noop } from "lodash";
import {
  agencySearch,
  debouncedAgencySearch,
} from "src/services/fetch/fetchers/clientAgenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { useState } from "react";
import { TextInput } from "@trussworks/react-uswds";

import { CheckboxFilterBody } from "../Filters/CheckboxFilter";

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
  const searchForAgencies = debounce(
    (searchTerm: string) => {
      agencySearch(searchTerm)
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
      <CheckboxFilterBody
        query={query}
        queryParamKey={"agency"}
        title={title}
        includeAnyOption={true}
        filterOptions={agencySearchResults || agencies}
        facetCounts={facetCounts}
      />
    </>
  );
}
