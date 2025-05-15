"use client";

import { FilterOptionWithChildren } from "src/types/search/searchFilterTypes";

import { AllOptionCheckbox } from "src/components/search/SearchFilterAccordion/AllOptionCheckbox";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";

interface SearchFilterSectionProps {
  option: FilterOptionWithChildren;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  accordionTitle: string;
  query: Set<string>;
  facetCounts?: { [key: string]: number };
}

const SearchFilterSection = ({
  option,
  updateCheckedOption,
  accordionTitle,
  query,
  facetCounts,
}: SearchFilterSectionProps) => {
  return (
    <div>
      <div className="text-bold margin-top-1">{option.label}</div>
      <div className="padding-y-1">
        <AllOptionCheckbox
          title={option.label}
          queryParamKey="agency"
          childOptions={option.children}
          currentSelections={query}
        />
        <ul className="usa-list usa-list--unstyled margin-left-4">
          {option.children?.map((child) => (
            <li key={child.id}>
              <SearchFilterCheckbox
                option={child}
                query={query}
                updateCheckedOption={updateCheckedOption}
                accordionTitle={accordionTitle}
                facetCounts={facetCounts}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchFilterSection;
