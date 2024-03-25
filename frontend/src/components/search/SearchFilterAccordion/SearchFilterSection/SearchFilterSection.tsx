"use client";

import { useEffect, useState } from "react";

import { FilterOption } from "../SearchFilterAccordion";
import SearchFilterCheckbox from "../SearchFilterCheckbox";
import SearchFilterToggleAll from "../SearchFilterToggleAll";
import SectionLinkCount from "./SectionLinkCount";
import SectionLinkLabel from "./SectionLinkLabel";

interface SearchFilterSectionProps {
  option: FilterOption;
  incrementTotal: () => void;
  decrementTotal: () => void;
  mounted: boolean;
  updateCheckedOption: (optionId: string, isChecked: boolean) => void;
  toggleSelectAll: (isSelected: boolean, sectionId: string) => void;
  accordionTitle: string;
  isSectionAllSelected: boolean;
  isSectionNoneSelected: boolean;
}

const SearchFilterSection: React.FC<SearchFilterSectionProps> = ({
  option,
  incrementTotal,
  decrementTotal,
  mounted,
  updateCheckedOption,
  toggleSelectAll,
  accordionTitle,
  isSectionAllSelected,
  isSectionNoneSelected,
}) => {
  const [childrenVisible, setChildrenVisible] = useState<boolean>(false);

  // TODO: Set this number per state/query params
  const [sectionCount, setSectionCount] = useState<number>(0);
  const increment = () => {
    setSectionCount(sectionCount + 1);
    incrementTotal();
  };
  const decrement = () => {
    setSectionCount(sectionCount - 1);
    decrementTotal();
  };

  const handleSelectAll = () => {
    toggleSelectAll(true, option.id);
  };

  const handleClearAll = () => {
    toggleSelectAll(false, option.id);
  };

  useEffect(() => {
    if (option.children) {
      const newCount = option.children.filter(
        (child) => child.isChecked,
      ).length;
      setSectionCount(newCount);
    }
  }, [option.children]);

  const getHiddenName = (name: string) =>
    accordionTitle === "Agency" ? `agency-${name}` : name;

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
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            isAllSelected={isSectionAllSelected}
            isNoneSelected={isSectionNoneSelected}
          />
          <ul className="usa-list usa-list--unstyled margin-left-4">
            {option.children?.map((child) => (
              <li key={child.id}>
                <SearchFilterCheckbox
                  option={child}
                  increment={increment}
                  decrement={decrement}
                  mounted={mounted}
                  updateCheckedOption={updateCheckedOption}
                  accordionTitle={accordionTitle}
                  //   value={child.id} // TODO: consider passing the actual value to the server action
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
