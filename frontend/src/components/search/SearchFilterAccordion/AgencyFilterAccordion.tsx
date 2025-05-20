"use client";

import { FilterOption } from "src/types/search/searchFilterTypes";
import { SearchAPIResponse } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { TextInput } from "@trussworks/react-uswds";

import { BasicSearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { AgencyFilterContent } from "../Filters/AgencyFilterContent";
import { CheckboxFilter } from "../Filters/CheckboxFilter";

const searchForAgencies = (searchTerm: string) => Promise.resolve([]);

export function AgencyFilterAccordion({
  query,
  searchResultsPromise,
}: {
  query: Set<string>;
  searchResultsPromise: Promise<SearchAPIResponse>;
}) {
  const t = useTranslations("Search");
  const [agenciesPromise, setAgenciesPromise] = useState<
    Promise<FilterOption[]>
  >(Promise.resolve([]));

  const updateAgencyListOnSearch = (searchTerm: string) => {
    console.log("$$$ search keyword", searchTerm);
    setAgenciesPromise(searchForAgencies(searchTerm));
  };

  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={"agency"}
      title={t("accordion.titles.agency")}
    >
      <>
        <TextInput
          type="text"
          name="LastName"
          id="LastName"
          onChange={(e) => updateAgencyListOnSearch(e.target.value)}
        />
        <Suspense
          key=""
          fallback={
            <CheckboxFilter
              filterOptions={[]}
              query={query}
              queryParamKey={"agency"}
              title={t("accordion.titles.agency")}
              wrapForScroll={true}
              facetCounts={{}}
            />
          }
        >
          <AgencyFilterContent
            query={query}
            title={t("accordion.titles.agency")}
            searchResultsPromise={searchResultsPromise}
            agencySearchPromise={agenciesPromise}
          />
        </Suspense>
      </>
    </BasicSearchFilterAccordion>
  );
}
