"use client";

import { useState } from "react";

import SearchFilterAccordion, {
  SearchFilterConfiguration,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterToggle from "src/components/search/SearchFilterToggle";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";

export default function SearchFilters({
  opportunityStatus,
  filterConfigurations,
}: {
  opportunityStatus: Set<string>;
  filterConfigurations: SearchFilterConfiguration[];
}) {
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const FilterAccordions = filterConfigurations.map(
    ({ filterOptions, query, queryParamKey, title }) => {
      return (
        <SearchFilterAccordion
          filterOptions={filterOptions}
          query={query}
          queryParamKey={queryParamKey}
          title={title}
          key={title}
        />
      );
    },
  );
  return (
    <>
      <SearchFilterToggle
        setShowFilterOptions={setShowFilterOptions}
        showFilterOptions={showFilterOptions}
        buttonText={showFilterOptions ? "Hide Filters" : "Show Filters"}
      />
      <div className="filter-options">
        {showFilterOptions && (
          <>
            <SearchOpportunityStatus query={opportunityStatus} />
            {FilterAccordions}
          </>
        )}
      </div>
    </>
  );
}
