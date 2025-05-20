"use client";

import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { TextInput } from "@trussworks/react-uswds";

import { CheckboxFilterBody } from "../Filters/CheckboxFilter";

const searchForAgencies = (searchTerm: string) => {
  console.log("!!!", searchTerm);
  return Promise.resolve([]);
};

export function AgencyFilterContent({ query, title, agencies, facetCounts }) {
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
        filterOptions={agencies}
        facetCounts={facetCounts}
      />
    </>
  );
}
