"use client";

import { FilterOptionWithChildren } from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";

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
  queryParamKey: ValidSearchQueryParam;
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
  queryParamKey,
  isParentSelected = () => false,
}: SearchFilterSectionProps) => {
  return (
    <>
      <div className="text-bold margin-top-1">{option.label}</div>
      <div className="padding-y-1">
        <AllOptionCheckbox
          title={option.label}
          queryParamKey={queryParamKey}
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
