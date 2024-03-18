import FilterCheckbox from "../../FilterCheckbox";
import { FilterOption } from "./SearchFilterAccordion";

interface SearchFilterCheckboxProps {
  option: FilterOption;
  increment: () => void;
  decrement: () => void;
  mounted: boolean;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
}

const SearchFilterCheckbox: React.FC<SearchFilterCheckboxProps> = ({
  option,
  increment,
  decrement,
  mounted,
  updateCheckedOption,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    checked ? increment() : decrement();
    updateCheckedOption(option.id, checked);
  };

  return (
    <FilterCheckbox
      id={option.id}
      label={option.label}
      onChange={handleChange}
      disabled={!mounted}
      checked={option.isChecked === true}
    />
  );
};

export default SearchFilterCheckbox;
