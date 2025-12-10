"use client";

import { FilterOption } from "src/types/search/searchFilterTypes";

import FilterCheckbox from "src/components/FilterCheckbox";
import { FilterOptionLabel } from "src/components/search/Filters/FilterOptionLabel";

interface SearchFilterCheckboxProps {
  option: FilterOption;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  accordionTitle: string;
  query: Set<string>;
  facetCounts?: { [key: string]: number };
  parentSelected?: boolean;
}

const SearchFilterCheckbox = ({
  option,
  updateCheckedOption,
  accordionTitle,
  query,
  facetCounts,
  parentSelected,
}: SearchFilterCheckboxProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    updateCheckedOption(event.target.value, checked);
  };

  const getNameAttribute = () =>
    accordionTitle === "Agency" ? `agency-${option.id}` : option.id;

  return (
    <FilterCheckbox
      id={option.id} // could change this if the numerical ids are a problem
      label={<FilterOptionLabel option={option} facetCounts={facetCounts} />}
      name={getNameAttribute()} // value passed to server action  {name: "{option.label}", value: "on" } (if no value provided)
      onChange={handleChange}
      checked={query.has(option.value) || parentSelected}
      value={option.value}
    />
  );
};

export default SearchFilterCheckbox;
