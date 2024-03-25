"use client";

import FilterCheckbox from "../../FilterCheckbox";
import { FilterOption } from "./SearchFilterAccordion";

interface SearchFilterCheckboxProps {
  option: FilterOption;
  increment: () => void;
  decrement: () => void;
  mounted: boolean;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  accordionTitle: string;
}

const SearchFilterCheckbox: React.FC<SearchFilterCheckboxProps> = ({
  option,
  increment,
  decrement,
  mounted,
  updateCheckedOption,
  accordionTitle,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    checked ? increment() : decrement();
    updateCheckedOption(option.id, checked);
  };

  const getNameAttribute = () =>
    accordionTitle === "Agency" ? `agency-${option.id}` : option.id;

  return (
    <FilterCheckbox
      id={option.id}
      label={option.label}
      name={getNameAttribute()} // value passed to server action  {name: "{option.label}", value: "on" } (if no value provided)
      onChange={handleChange}
      disabled={!mounted}
      checked={option.isChecked === true}
      //   value={option.id} // TODO: consider poassing explicit value
    />
  );
};

export default SearchFilterCheckbox;
