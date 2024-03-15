import React, { useEffect, useState } from "react";

import { Accordion } from "@trussworks/react-uswds";
import SearchFilterCheckbox from "./SearchFilterCheckbox";
import SearchFilterSection from "./SearchFilterSection/SearchFilterSection";
import SearchFilterToggleAll from "./SearchFilterToggleAll";

export interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  // handleToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  isChecked?: boolean;
  children?: FilterOption[];
}

interface SearchFilterAccordionProps {
  filterOptions: FilterOption[];
  title: string;
}

export function SearchFilterAccordion({
  filterOptions,
  title,
}: SearchFilterAccordionProps) {
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize options with unchecked state
  const [options, setOptions] = useState<FilterOption[]>(
    filterOptions.map((option) => ({
      ...option,
      isChecked: false,
      children: option.children
        ? option.children.map((child) => ({
            ...child,
            isChecked: false,
          }))
        : undefined,
    })),
  );
  const [mounted, setMounted] = useState<boolean>(false);

  const [checkedTotal, setCheckedTotal] = useState<number>(0);
  const incrementTotal = () => {
    setCheckedTotal(checkedTotal + 1);
  };
  const decrementTotal = () => {
    setCheckedTotal(checkedTotal - 1);
  };

  const countChecked = (optionsList: FilterOption[]): number => {
    return optionsList.reduce((acc, option) => {
      const childrenChecked = option.children
        ? countChecked(option.children)
        : 0;
      return acc + (option.isChecked ? 1 : 0) + childrenChecked;
    }, 0);
  };

  const toggleSelectAll = (isSelected: boolean, sectionId?: string) => {
    const recursiveToggle = (
      optionsList: FilterOption[],
      withinSection = false,
    ): FilterOption[] =>
      optionsList.map((option) => {
        // Determine if the current option is within the specified section or if no section is specified
        const isInSection = sectionId
          ? option.id === sectionId || withinSection
          : true;

        return {
          ...option,
          // Toggle only if in the specified section (or no section is specified)
          isChecked: isInSection ? isSelected : option.isChecked,
          children: option.children
            ? recursiveToggle(option.children, isInSection)
            : undefined,
        };
      });

    setOptions((currentOptions) => {
      const newOptions = recursiveToggle(currentOptions);
      setCheckedTotal(countChecked(newOptions));
      return newOptions;
    });
  };

  const toggleOptionChecked = (optionId: string, isChecked: boolean) => {
    const updateChecked = (options: FilterOption[]): FilterOption[] =>
      options.map((opt) => ({
        ...opt,
        isChecked: opt.id === optionId ? isChecked : opt.isChecked,
        children: opt.children ? updateChecked(opt.children) : undefined,
      }));

    setOptions((prevOptions) => updateChecked(prevOptions));
  };

  const getAccordionTitle = () => (
    <>
      {title}
      {!!checkedTotal && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {checkedTotal}
        </span>
      )}
    </>
  );

  const getAccordionContent = () => (
    <>
      <SearchFilterToggleAll
        onSelectAll={() => toggleSelectAll(true)}
        onClearAll={() => toggleSelectAll(false)}
      />
      <ul className="usa-list usa-list--unstyled">
        {options.map((option) => (
          <li key={option.id}>
            {/* If we have children, show a "section" dropdown, otherwise show just a checkbox */}
            {option.children ? (
              // SearchFilterSection will map over all children of this option
              <SearchFilterSection
                option={option}
                incrementTotal={incrementTotal}
                decrementTotal={decrementTotal}
                mounted={mounted}
                updateCheckedOption={toggleOptionChecked}
                toggleSelectAll={toggleSelectAll}
              />
            ) : (
              <SearchFilterCheckbox
                option={option}
                increment={incrementTotal}
                decrement={decrementTotal}
                mounted={mounted}
                updateCheckedOption={toggleOptionChecked}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );

  const accordionOptions: AccordionItemProps[] = [
    {
      title: getAccordionTitle(),
      content: getAccordionContent(),
      expanded: false,
      id: "funding-instrument-filter",
      headingLevel: "h4",
    },
  ];

  return (
    <Accordion
      bordered={true}
      items={accordionOptions}
      multiselectable={true}
      className="margin-top-4"
    />
  );
}

export default SearchFilterAccordion;
