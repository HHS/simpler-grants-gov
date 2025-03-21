"use client";

import FilterCheckbox from "src/components/FilterCheckbox";
import { FilterOption } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

interface SearchFilterCheckboxProps {
  option: FilterOption;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  accordionTitle: string;
  query: Set<string>;
  facetCounts: { [key: string]: number };
}

const SearchFilterCheckbox: React.FC<SearchFilterCheckboxProps> = ({
  option,
  updateCheckedOption,
  accordionTitle,
  query,
  facetCounts,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    updateCheckedOption(event.target.value, checked);
  };

  const getNameAttribute = () =>
    accordionTitle === "Agency" ? `agency-${option.id}` : option.id;
  const facetCount = facetCounts[option.value];

  if (!facetCount) {
    return;
  }

  return (
    <FilterCheckbox
      id={option.id}
      label={
        <>
          <span>{option.label}</span>
          <span className="text-base-dark padding-left-05">[{facetCount}]</span>
        </>
      }
      name={getNameAttribute()} // value passed to server action  {name: "{option.label}", value: "on" } (if no value provided)
      onChange={handleChange}
      checked={query.has(option.value)}
      value={option.value}
    />
  );
};

export default SearchFilterCheckbox;
