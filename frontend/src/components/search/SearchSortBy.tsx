
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

const SearchSortBy: React.FC = () => {
  return (
    <div id="search-sort-by">
      <select
        className="usa-select"
        name="search-sort-by"
        id="search-sort-by-select"
      >
        {SORT_OPTIONS.map((option: SortOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchSortBy;
