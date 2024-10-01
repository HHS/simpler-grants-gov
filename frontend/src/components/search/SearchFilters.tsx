"use client";

import clsx from "clsx";

import { useState } from "react";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";
import SearchFilterAccordion from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import {
  agencyOptions,
  categoryOptions,
  eligibilityOptions,
  fundingOptions,
} from "src/components/search/SearchFilterAccordion/SearchFilterOptions";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";

export default function SearchFilters({
  fundingInstrument,
  eligibility,
  agency,
  category,
  opportunityStatus,
  categoryTitle,
  eligibilityTitle,
  fundingTitle,
  agencyTitle,
}: {
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  opportunityStatus: Set<string>;
  categoryTitle: string;
  eligibilityTitle: string;
  fundingTitle: string;
  agencyTitle: string;
}) {
  // all filter options will be displayed on > mobile viewports
  // on mobile, filter options will be hidden by default and can be toggled here
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  return (
    <>
      <div className="display-flex flex-column flex-align-center tablet:display-none">
        <ContentDisplayToggle
          setToggledContentVisible={setShowFilterOptions}
          toggledContentVisible={showFilterOptions}
          toggleText={showFilterOptions ? "Hide Filters" : "Show Filters"}
        />
      </div>
      <div
        data-testid="search-filters"
        className={clsx({
          "display-none": !showFilterOptions,
          "tablet:display-block": true,
        })}
      >
        <SearchOpportunityStatus query={opportunityStatus} />
        <SearchFilterAccordion
          filterOptions={fundingOptions}
          query={fundingInstrument}
          queryParamKey="fundingInstrument"
          title={fundingTitle}
        />
        <SearchFilterAccordion
          filterOptions={eligibilityOptions}
          query={eligibility}
          queryParamKey={"eligibility"}
          title={eligibilityTitle}
        />
        <SearchFilterAccordion
          filterOptions={agencyOptions}
          query={agency}
          queryParamKey={"agency"}
          title={agencyTitle}
        />
        <SearchFilterAccordion
          filterOptions={categoryOptions}
          query={category}
          queryParamKey={"category"}
          title={categoryTitle}
        />
      </div>
    </>
  );
}
