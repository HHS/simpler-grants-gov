"use client";

import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryParamKey } from "src/types/search/searchResponseTypes";

import { useContext } from "react";
import { Accordion } from "@trussworks/react-uswds";

import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";
import SearchFilterToggleAll from "src/components/search/SearchFilterAccordion/SearchFilterToggleAll";

export interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  isChecked?: boolean;
  children?: FilterOption[];
}

export interface FilterOptionWithChildren {
  id: string;
  label: string;
  value: string;
  isChecked?: boolean;
  children: FilterOption[];
}

interface SearchFilterAccordionProps {
  filterOptions: FilterOption[];
  title: string; // Title in header of accordion
  query: Set<string>;
  queryParamKey: QueryParamKey; // Ex - In query params, search?{key}=first,second,third
}

export function SearchFilterAccordion({
  filterOptions,
  title,
  queryParamKey,
  query,
}: SearchFilterAccordionProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams } = useSearchParamUpdater();
  const totalCheckedCount = query.size;
  // These are all of the available selectedable options.
  const allOptionValues = filterOptions.map((options) => options.value);
  // This is the setting if all are selected.
  const allSelected = new Set(allOptionValues);

  const getAccordionTitle = () => (
    <>
      {title}
      {!!totalCheckedCount && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {totalCheckedCount}
        </span>
      )}
    </>
  );

  const toggleSelectAll = (all: boolean, allSelected: Set<string>): void => {
    if (all) {
      updateQueryParams(allSelected, queryParamKey, queryTerm);
    } else {
      const noneSelected = new Set<string>();
      updateQueryParams(noneSelected, queryParamKey, queryTerm);
    }
  };

  const isSectionAllSelected = (
    allSelected: Set<string>,
    query: Set<string>,
  ): boolean => {
    return areSetsEqual(allSelected, query);
  };

  const isSectionNoneSelected = (query: Set<string>): boolean => {
    return query.size === 0;
  };

  const areSetsEqual = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && [...a].every((value) => b.has(value));

  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const updated = new Set(query);
    isChecked ? updated.add(value) : updated.delete(value);
    updateQueryParams(updated, queryParamKey, queryTerm);
  };

  const isExpanded = !!query.size;

  const getAccordionContent = () => (
    <>
      <SearchFilterToggleAll
        onSelectAll={() => toggleSelectAll(true, allSelected)}
        onClearAll={() => toggleSelectAll(false, allSelected)}
        isAllSelected={isSectionAllSelected(allSelected, query)}
        isNoneSelected={isSectionNoneSelected(query)}
      />

      <ul className="usa-list usa-list--unstyled">
        {filterOptions.map((option) => (
          <li key={option.id}>
            {/* If we have children, show a "section" dropdown, otherwise show just a checkbox */}
            {option.children ? (
              // SearchFilterSection will map over all children of this option
              <SearchFilterSection
                option={option as FilterOptionWithChildren}
                value={option.value}
                query={query}
                updateCheckedOption={toggleOptionChecked}
                toggleSelectAll={toggleSelectAll}
                accordionTitle={title}
                isSectionAllSelected={isSectionAllSelected}
                isSectionNoneSelected={isSectionNoneSelected}
              />
            ) : (
              <SearchFilterCheckbox
                option={option}
                query={query}
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
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
      expanded: isExpanded,
      id: `funding-instrument-filter-${queryParamKey}`,
      headingLevel: "h2",
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
