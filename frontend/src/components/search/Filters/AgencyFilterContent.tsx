"use client";

import { debouncedAgencySearch } from "src/services/fetch/fetchers/clientAgenciesFetcher";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

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
  const searchForAgencies = (searchTerm: string) => {
    console.log("!!!", searchTerm);
    debouncedAgencySearch(searchTerm)
      .then((searchResults) => {
        console.log("fetched agency option search", searchResults);
        setAgencySearchResults(searchResults);
      })
      .catch((e) => {
        console.error("Error fetching agency search results", e);
        setAgencySearchResults(undefined);
      });
  };

  console.log("render", agencySearchResults, agencies);
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
