"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import { FilterOptionWithChildren } from "src/types/search/searchFilterTypes";

import { useContext, useMemo } from "react";

import { AnyOptionCheckbox } from "../SearchFilterAccordion/AnyOptionCheckbox";
import {
  BasicSearchFilterAccordion,
  SearchFilterAccordionProps,
} from "../SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "../SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "../SearchFilterAccordion/SearchFilterSection/SearchFilterSection";

export function CheckboxFilter({
  query,
  queryParamKey,
  title,
  wrapForScroll,
  defaultEmptySelection,
  includeAnyOption,
  filterOptions,
  facetCounts,
}: SearchFilterAccordionProps) {
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
  const content = (
    <div data-testid={`${title}-filter`}>
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
    </div>
  );

  return (
    <BasicSearchFilterAccordion
      content={content}
      query={query}
      queryParamKey={queryParamKey}
      title={title}
      wrapForScroll={wrapForScroll}
      className="width-100"
    />
  );
}
