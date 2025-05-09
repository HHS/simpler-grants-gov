"use client";

import { camelCase } from "lodash";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import {
  FilterOption,
  FilterOptionWithChildren,
  ValidSearchQueryParam,
} from "src/types/search/searchResponseTypes";
import { areSetsEqual } from "src/utils/search/searchUtils";

import { useContext, useMemo } from "react";
import { Accordion } from "@trussworks/react-uswds";

import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";
import SearchFilterToggleAll from "src/components/search/SearchFilterAccordion/SearchFilterToggleAll";
import { AnyOptionCheckbox } from "./AnyOptionCheckbox";

export interface AccordionItemProps {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

export interface SearchAccordionContentProps {
  query: Set<string>;
  queryParamKey: ValidSearchQueryParam; // Ex - In query params, search?{key}=first,second,third
  title: string; // Title in header of accordion
  filterOptions: FilterOption[];
  facetCounts?: { [key: string]: number };
  defaultEmptySelection?: Set<string>;
  includeAnyOption?: boolean;
}

export interface SearchFilterAccordionProps
  extends SearchAccordionContentProps {
  wrapForScroll?: boolean;
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
  defaultEmptySelection,
  includeAnyOption = true,
}: SearchAccordionContentProps) => {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams, searchParams } = useSearchParamUpdater();

  // TODO: implement this within the components where it's used to make it more testable
  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const newParamValue = new Set(query);
    isChecked ? newParamValue.add(value) : newParamValue.delete(value);
    // handle status filter custom behavior to set param when all options are unselected
    const updatedParamValue =
      !newParamValue.size && defaultEmptySelection?.size
        ? defaultEmptySelection
        : newParamValue;
    updateQueryParams(updatedParamValue, queryParamKey, queryTerm);
  };

  // all top level selectable filter options
  const allOptionValues = useMemo(
    () =>
      new Set(
        filterOptions.reduce((values: string[], option) => {
          if (option.children) {
            return values;
          }
          values.push(option.value);
          return values;
        }, []),
      ),
    [filterOptions],
  );

  const isNoneSelected = useMemo(() => query.size === 0, [query]);

  // need to add any existing relevant search params to the passed in set
  // TODO: split this into two functions and implement within the components where they're used to make it more testable
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
      const clearedSelections = newSelections?.size
        ? newSelections
        : new Set<string>();
      updateQueryParams(clearedSelections, queryParamKey, queryTerm);
    }
  };

  return (
    <>
      <SearchFilterToggleAll
        onSelectAll={() => toggleSelectAll(true, allOptionValues)}
        onClearAll={() => toggleSelectAll(false, defaultEmptySelection)}
        isAllSelected={areSetsEqual(allOptionValues, query)}
        isNoneSelected={isNoneSelected}
      />
      <ul className="usa-list usa-list--unstyled">
        {includeAnyOption && (
          <li>
            <AnyOptionCheckbox
              title={title.toLowerCase()}
              checked={isNoneSelected}
              queryParamKey={queryParamKey}
              defaultEmptySelection={defaultEmptySelection}
            />
          </li>
        )}
        {filterOptions.map((option) => (
          <li key={option.id}>
            {/* If we have children, show a "section", otherwise show just a checkbox */}
            {option.children ? (
              // SearchFilterSection will map over all children of this option
              <SearchFilterSection
                option={option as FilterOptionWithChildren}
                query={query}
                updateCheckedOption={toggleOptionChecked}
                accordionTitle={title}
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
  defaultEmptySelection,
  includeAnyOption = true,
  wrapForScroll = false,
}: SearchFilterAccordionProps) {
  const accordionOptions: AccordionItemProps[] = [
    {
      title: <AccordionTitle title={title} totalCheckedCount={query.size} />,
      content: wrapForScroll ? (
        <div
          className="maxh-mobile-lg minh-mobile overflow-scroll"
          data-testid={`${title}-accordion-scroll`}
        >
          <AccordionContent
            filterOptions={filterOptions}
            title={title}
            queryParamKey={queryParamKey}
            query={query}
            facetCounts={facetCounts}
            defaultEmptySelection={defaultEmptySelection}
            includeAnyOption={includeAnyOption}
          />
        </div>
      ) : (
        <AccordionContent
          filterOptions={filterOptions}
          title={title}
          queryParamKey={queryParamKey}
          query={query}
          facetCounts={facetCounts}
          defaultEmptySelection={defaultEmptySelection}
          includeAnyOption={includeAnyOption}
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
