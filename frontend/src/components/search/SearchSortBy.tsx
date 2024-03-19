import { useSearchParamUpdater } from "../../hooks/useSearchParamUpdater";
import { useState } from "react";

type SortOption = {
  label: string;
  value: string;
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Opportunity Number (Ascending)", value: "opportunityNumberAsc" },
  { label: "Opportunity Number (Descending)", value: "opportunityNumberDesc" },
  { label: "Opportunity Title (Ascending)", value: "opportunityTitleAsc" },
  { label: "Opportunity Title (Descending)", value: "opportunityTitleDesc" },
  { label: "Agency (Ascending)", value: "agencyAsc" },
  { label: "Agency (Descending)", value: "agencyDesc" },
  { label: "Posted Date (Ascending)", value: "postedDateAsc" },
  { label: "Posted Date (Descending)", value: "postedDateDesc" },
  { label: "Close Date (Ascending)", value: "closeDateAsc" },
  { label: "Close Date (Descending)", value: "closeDateDesc" },
];

interface SearchSortByProps {
  formRef: React.RefObject<HTMLFormElement>;
  initialQueryParams: string;
}

const SearchSortBy: React.FC<SearchSortByProps> = ({
  formRef,
  initialQueryParams,
}) => {
  const [sortBy, setSortBy] = useState(initialQueryParams || SORT_OPTIONS[0].value);
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
