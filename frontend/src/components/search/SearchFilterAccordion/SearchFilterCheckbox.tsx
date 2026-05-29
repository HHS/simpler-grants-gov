"use client";

import { FilterOption } from "src/types/search/searchFilterTypes";

import { Checkbox } from "@trussworks/react-uswds";

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
    <Checkbox
      id={option.id}
      name={getNameAttribute() || ""}
      label={<FilterOptionLabel option={option} facetCounts={facetCounts} />}
      onChange={handleChange}
      checked={query.has(option.value) || parentSelected}
      value={option.value || ""}
    />
  );
};

export default SearchFilterCheckbox;
