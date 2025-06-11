"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";
import {
  FilterOption,
  FilterOptionWithChildren,
} from "src/types/search/searchFilterTypes";

import { useContext, useMemo } from "react";

import { AnyOptionCheckbox } from "src/components/search/SearchFilterAccordion/AnyOptionCheckbox";
import {
  BasicSearchFilterAccordion,
  SearchFilterAccordionProps,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";

interface CheckboxFilterBodyProps extends SearchFilterAccordionProps {
  referenceOptions?: FilterOption[];
}

export function CheckboxFilterBody({
  includeAnyOption,
  title,
  queryParamKey,
  defaultEmptySelection,
  filterOptions,
  query,
  facetCounts,
  referenceOptions,
}: CheckboxFilterBodyProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams } = useSearchParamUpdater();

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
                referenceOption={
                  referenceOptions &&
                  (referenceOptions.find(
                    (referenceOption) => referenceOption.id === option.id,
                  ) as FilterOptionWithChildren)
                }
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
}

export function CheckboxFilter({
  query,
  queryParamKey,
  title,
  contentClassName,
  defaultEmptySelection,
  includeAnyOption = true,
  filterOptions,
  facetCounts,
}: SearchFilterAccordionProps) {
  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={queryParamKey}
      title={title}
      contentClassName={contentClassName}
      expanded={!!query.size}
      className="width-100 padding-right-5"
    >
      <CheckboxFilterBody
        query={query}
        queryParamKey={queryParamKey}
        title={title}
        defaultEmptySelection={defaultEmptySelection}
        includeAnyOption={includeAnyOption}
        filterOptions={filterOptions}
        facetCounts={facetCounts}
      />
    </BasicSearchFilterAccordion>
  );
}
