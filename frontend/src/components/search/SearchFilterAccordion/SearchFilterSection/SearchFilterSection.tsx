"use client";

import { noop } from "lodash";
import { FilterOptionWithChildren } from "src/types/search/searchFilterTypes";

import { AllOptionCheckbox } from "src/components/search/SearchFilterAccordion/AllOptionCheckbox";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";

interface SearchFilterSectionProps {
  option: FilterOptionWithChildren;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  accordionTitle: string;
  query: Set<string>;
  facetCounts?: { [key: string]: number };
  referenceOption?: FilterOptionWithChildren;
  topLevelQuery?: Set<string>;
  topLevelQueryParamKey?: string;
  isParentSelected?: (value: string) => boolean;
}

const SearchFilterSection = ({
  option,
  updateCheckedOption,
  accordionTitle,
  query,
  facetCounts,
  referenceOption,
  topLevelQuery,
  topLevelQueryParamKey,
  isParentSelected = () => false,
}: SearchFilterSectionProps) => {
  return (
    <>
      <div className="text-bold margin-top-1">{option.label}</div>
      <div className="padding-y-1">
        <AllOptionCheckbox
          title={option.label}
          queryParamKey="topLevelAgency"
          childOptions={
            referenceOption ? referenceOption.children : option.children
          }
          currentSelections={query}
          topLevelQueryParamKey={topLevelQueryParamKey}
          topLevelQuery={topLevelQuery}
          topLevelQueryValue={option.value}
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
                parentSelected={isParentSelected(option.value)}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default SearchFilterSection;
