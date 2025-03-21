"use client";

import { camelCase } from "lodash";
import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { ValidSearchQueryParam } from "src/types/search/searchResponseTypes";
import { areSetsEqual } from "src/utils/search/searchUtils";

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
  children?: FilterOption[];
  id: string;
  isChecked?: boolean;
  label: string;
  value: string;
}

export interface SearchFilterAccordionProps {
  query: Set<string>;
  queryParamKey: ValidSearchQueryParam; // Ex - In query params, search?{key}=first,second,third
  title: string; // Title in header of accordion
  filterOptions: FilterOption[];
  facetCounts: { [key: string]: number };
}

export interface FilterOptionWithChildren {
  id: string;
  label: string;
  value: string;
  isChecked?: boolean;
  children: FilterOption[];
}

const AccordionTitle = ({
  title,
  totalCheckedCount,
}: {
  title: string;
  totalCheckedCount: number;
}) => {
  return (
    <>
      {title}
      {!!totalCheckedCount && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {totalCheckedCount}
        </span>
      )}
    </>
  );
};

const AccordionContent = ({
  filterOptions,
  title,
  queryParamKey,
  query,
  facetCounts,
}: SearchFilterAccordionProps) => {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams, searchParams } = useSearchParamUpdater();

  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const updated = new Set(query);
    isChecked ? updated.add(value) : updated.delete(value);
    updateQueryParams(updated, queryParamKey, queryTerm);
  };

  // all top level selectable filter options
  const allOptionValues = filterOptions.reduce((values: string[], option) => {
    if (option.children) {
      return values;
    }
    values.push(option.value);
    return values;
  }, []);

  const allSelected = new Set(allOptionValues);

  // need to add any existing relevant search params to the passed in set
  const toggleSelectAll = (all: boolean, newSelections?: Set<string>): void => {
    if (all && newSelections) {
      // get existing current selected options for this accordion from url
      const currentSelections = new Set(
        searchParams.get(camelCase(title))?.split(","),
      );
      // add existing to newly selected section
      const sectionPlusCurrent = new Set([
        ...currentSelections,
        ...newSelections,
      ]);
      updateQueryParams(sectionPlusCurrent, queryParamKey, queryTerm);
    } else {
      const clearedSelections = newSelections || new Set<string>();
      updateQueryParams(clearedSelections, queryParamKey, queryTerm);
    }
  };

  return (
    <>
      <SearchFilterToggleAll
        onSelectAll={() => toggleSelectAll(true, allSelected)}
        onClearAll={() => toggleSelectAll(false)}
        isAllSelected={areSetsEqual(allSelected, query)}
        isNoneSelected={query.size === 0}
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
                isSectionAllSelected={areSetsEqual}
                isSectionNoneSelected={() => query.size === 0}
                facetCounts={facetCounts}
              />
            ) : (
              <SearchFilterCheckbox
                option={option}
                query={query}
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
                facetCounts={facetCounts}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export function SearchFilterAccordion({
  filterOptions,
  title,
  queryParamKey,
  query,
  facetCounts,
}: SearchFilterAccordionProps) {
  const accordionOptions: AccordionItemProps[] = [
    {
      title: <AccordionTitle title={title} totalCheckedCount={query.size} />,
      content: (
        <AccordionContent
          filterOptions={filterOptions}
          title={title}
          queryParamKey={queryParamKey}
          query={query}
          facetCounts={facetCounts}
        />
      ),
      expanded: !!query.size,
      id: `opportunity-filter-${queryParamKey as string}`,
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
