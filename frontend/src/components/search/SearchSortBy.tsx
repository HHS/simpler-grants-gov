import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";
import { useState } from "react";

type SortOption = {
  label: string;
  value: string;
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Posted Date (newest)", value: "postedDateDesc" },
  { label: "Posted Date (oldest)", value: "postedDateAsc" },
  { label: "Opportunity Number (newest)", value: "opportunityNumberDesc" },
  { label: "Opportunity Number (oldest)", value: "opportunityNumberAsc" },
  { label: "Opportunity Title (A to Z)", value: "opportunityTitleAsc" },
  { label: "Opportunity Title (Z to A)", value: "opportunityTitleDesc" },
  { label: "Agency (A to Z)", value: "agencyAsc" },
  { label: "Agency (Z to A)", value: "agencyDesc" },
  { label: "Close Date (descending)", value: "closeDateDesc" },
  { label: "Close Date (ascending)", value: "closeDateAsc" },
];

interface SearchSortByProps {
  formRef: React.RefObject<HTMLFormElement>;
  initialQueryParams: string;
}

const SearchSortBy: React.FC<SearchSortByProps> = ({
  formRef,
  initialQueryParams,
}) => {
  const [sortBy, setSortBy] = useState(
    initialQueryParams || SORT_OPTIONS[0].value,
  );
  const { updateQueryParams } = useSearchParamUpdater();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSortBy(newValue);
    const key = "sortby";
    updateQueryParams(newValue, key);
    formRef?.current?.requestSubmit();
  };

  return (
    <div id="search-sort-by">
      <select
        className="usa-select"
        name="search-sort-by"
        id="search-sort-by-select"
        onChange={handleChange}
        value={sortBy}
        aria-label="Sort By"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchSortBy;
