"use client";

import { FilterOptionLabel } from "src/app/[locale]/(base)/search/_components/Filters/FilterOptionLabel";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { Checkbox } from "@trussworks/react-uswds";

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

  // Coerce to a boolean so the input stays controlled. When query.has() is false
  // and parentSelected is undefined, the raw expression evaluates to undefined,
  // which makes React treat the checkbox as uncontrolled and keep its previous
  // checked state (for example after clearing filters).
  const isChecked = Boolean(query.has(option.value) || parentSelected);

  return (
    <Checkbox
      id={option.id}
      name={getNameAttribute() || ""}
      label={<FilterOptionLabel option={option} facetCounts={facetCounts} />}
      onChange={handleChange}
      checked={isChecked}
      value={option.value || ""}
    />
  );
};

export default SearchFilterCheckbox;
