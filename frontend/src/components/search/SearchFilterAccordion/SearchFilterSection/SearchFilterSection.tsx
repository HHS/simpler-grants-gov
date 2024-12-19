"use client";

import { camelCase } from "lodash";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { FilterOptionWithChildren } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SectionLinkCount from "src/components/search/SearchFilterAccordion/SearchFilterSection/SectionLinkCount";
import SectionLinkLabel from "src/components/search/SearchFilterAccordion/SearchFilterSection/SectionLinkLabel";
import SearchFilterToggleAll from "src/components/search/SearchFilterAccordion/SearchFilterToggleAll";

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
}

const SearchFilterSection: React.FC<SearchFilterSectionProps> = ({
  option,
  updateCheckedOption,
  toggleSelectAll,
  accordionTitle,
  query,
  isSectionAllSelected,
  isSectionNoneSelected,
  value,
}) => {
  const [childrenVisible, setChildrenVisible] = useState<boolean>(false);
  const searchParams = useSearchParams();

  const sectionQuery = new Set<string>();
  query.forEach((queryValue) => {
    // The value is treated as a child for some agencies if has children in the UI and so
    // is added to the count.
    if (queryValue.startsWith(`${value}-`) || query.has(value)) {
      sectionQuery.add(queryValue);
    }
  });
  const allSectionOptions = useMemo(
    () => new Set(option.children.map((options) => options.value)),
    [option],
  );

  const sectionCount = sectionQuery.size;

  const getHiddenName = (name: string) =>
    accordionTitle === "Agency" ? `agency-${name}` : name;

  const clearSection = useCallback(() => {
    const currentSelections = new Set(
      searchParams.get(camelCase(accordionTitle))?.split(","),
    );
    allSectionOptions.forEach((option) => {
      currentSelections.delete(option);
    });
    toggleSelectAll(false, currentSelections);
  }, [toggleSelectAll, accordionTitle, searchParams, allSectionOptions]);

  return (
    <div>
      <button
        className="usa-button usa-button--unstyled width-full border-bottom-2px border-base-lighter"
        onClick={(event) => {
          event.preventDefault();
          setChildrenVisible(!childrenVisible);
        }}
      >
        <span className="grid-row flex-align-center margin-left-neg-1">
          <SectionLinkLabel childrenVisible={childrenVisible} option={option} />
          <SectionLinkCount sectionCount={sectionCount} />
        </span>
      </button>
      {childrenVisible ? (
        <div className="padding-y-1">
          <SearchFilterToggleAll
            onSelectAll={() => toggleSelectAll(true, allSectionOptions)}
            onClearAll={() => clearSection()}
            isAllSelected={isSectionAllSelected(
              allSectionOptions,
              sectionQuery,
            )}
            isNoneSelected={isSectionNoneSelected(sectionQuery)}
          />
          <ul className="usa-list usa-list--unstyled margin-left-4">
            {option.children?.map((child) => (
              <li key={child.id}>
                <SearchFilterCheckbox
                  option={child}
                  query={query}
                  updateCheckedOption={updateCheckedOption}
                  accordionTitle={accordionTitle}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Collapsed sections won't send checked values to the server action.
        // So we need hidden inputs.
        option.children?.map((child) =>
          child.isChecked ? (
            <input
              key={child.id}
              type="hidden"
              //   name={child.value}
              name={getHiddenName(child.id)}
              value="on"
            />
          ) : null,
        )
      )}
    </div>
  );
};

export default SearchFilterSection;
