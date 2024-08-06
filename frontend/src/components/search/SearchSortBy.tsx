"use client";
import { Select } from "@trussworks/react-uswds";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useContext } from "react";

type SortOption = {
  label: string;
  value: string;
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Posted Date (newest)", value: "postedDateDesc" },
  { label: "Posted Date (oldest)", value: "postedDateAsc" },
  { label: "Close Date (newest)", value: "closeDateDesc" },
  { label: "Close Date (oldest)", value: "closeDateAsc" },
  { label: "Opportunity Title (A to Z)", value: "opportunityTitleAsc" },
  { label: "Opportunity Title (Z to A)", value: "opportunityTitleDesc" },
  { label: "Agency (A to Z)", value: "agencyAsc" },
  { label: "Agency (Z to A)", value: "agencyDesc" },
  { label: "Opportunity Number (descending)", value: "opportunityNumberDesc" },
  { label: "Opportunity Number (ascending)", value: "opportunityNumberAsc" },
];

interface SearchSortByProps {
  queryTerm: string | null | undefined;
  sortby: string | null;
  totalResults: string;
}

export default function SearchSortBy({
  queryTerm,
  sortby,
  totalResults,
}: SearchSortByProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const { updateTotalResults } = useContext(QueryContext);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    updateTotalResults(totalResults);
    updateQueryParams(newValue, "sortby", queryTerm);
  };

  return (
    <div id="search-sort-by">
      <label htmlFor="search-sort-by-select" className="usa-sr-only">
        Sort By
      </label>

      <Select
        id="search-sort-by-select"
        name="search-sort-by"
        onChange={handleChange}
        value={sortby || ""}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
