"use client";

import { camelCase } from "lodash";
import { FilterOptionWithChildren } from "src/types/search/searchResponseTypes";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import { AnyOptionCheckbox } from "../AnyOptionCheckbox";

interface SearchFilterSectionProps {
  option: FilterOptionWithChildren;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  toggleSelectAll: (all: boolean, allSelected?: Set<string>) => void;
  accordionTitle: string;
  isSectionAllSelected: (
    allSelected: Set<string>,
    query: Set<string>,
  ) => boolean;
  isSectionNoneSelected: (query: Set<string>) => boolean;
  query: Set<string>;
  value: string;
  facetCounts?: { [key: string]: number };
}

const SearchFilterSection = ({
  option,
  updateCheckedOption,
  toggleSelectAll,
  accordionTitle,
  query,
  isSectionAllSelected,
  isSectionNoneSelected,
  value,
  facetCounts,
}: SearchFilterSectionProps) => {
  const searchParams = useSearchParams();

  const allSectionOptions = useMemo(
    () => new Set(option.children.map((options) => options.value)),
    [option],
  );

  const clearSection = useCallback(() => {
    const currentSelections = new Set(
      searchParams.get(camelCase(accordionTitle))?.split(","),
    );
    allSectionOptions.forEach((option) => {
      currentSelections.delete(option);
    });
    toggleSelectAll(false, currentSelections);
  }, [toggleSelectAll, accordionTitle, searchParams, allSectionOptions]);

  // const isNoneSelected = useMemo(() => query.size === 0, [query]);
  // const isNoneSelected = useMemo(() => {
  //   return (
  //     query.size === 0 ||
  //     !option.children.some((childOption) => {
  //       query.has(childOption.value);
  //     })
  //   );
  // }, [query]);

  const isNoneSelected =
    query.size === 0 ||
    !option.children.some((childOption) => {
      query.has(childOption.value);
    });

  console.log("!!!", isNoneSelected);

  // console.log(
  //   "$$$",
  //   option.children.some((childOption) => {
  //     console.log("!!!", query, childOption.value);
  //     query.has(childOption.value);
  //   }),
  // );
  return (
    <div>
      <div>{option.label}</div>
      <div className="padding-y-1">
        <AnyOptionCheckbox
          title={option.label}
          queryParamKey="agency"
          checked={isNoneSelected}
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
