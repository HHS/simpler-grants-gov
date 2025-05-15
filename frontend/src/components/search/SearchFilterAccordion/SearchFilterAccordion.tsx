"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import {
  FilterOption,
  FilterOptionWithChildren,
  ValidSearchQueryParam,
} from "src/types/search/searchResponseTypes";

import { useContext, useMemo } from "react";
import { Accordion } from "@trussworks/react-uswds";

import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";
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
  const { updateQueryParams } = useSearchParamUpdater();

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

  const isNoneSelected = useMemo(() => query.size === 0, [query]);

  return (
    <>
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
        <div data-testid={`${title}-accordion-scroll`}>
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
      className: wrapForScroll
        ? "maxh-mobile-lg overflow-auto position-relative"
        : "",
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
