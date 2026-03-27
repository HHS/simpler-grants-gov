"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";

import { useContext, useMemo } from "react";

import { AnyOptionCheckbox } from "src/components/search/SearchFilterAccordion/AnyOptionCheckbox";
import {
  BasicSearchFilterAccordion,
  SearchAccordionContentProps,
  SearchFilterProps,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";

export function CheckboxFilterBody({
  includeAnyOption,
  title,
  queryParamKey,
  defaultEmptySelection,
  filterOptions,
  query,
  facetCounts,
}: SearchAccordionContentProps) {
  const { queryTerm } = useContext(QueryContext);
  const { updateQueryParams } = useSearchParamUpdater();

  const toggleOptionChecked = (value: string, isChecked: boolean) => {
    const newParamValue = new Set(query);
    if (isChecked) {
      newParamValue.add(value);
    } else {
      newParamValue.delete(value);
    }
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
            <SearchFilterCheckbox
              option={option}
              query={query}
              updateCheckedOption={toggleOptionChecked}
              accordionTitle={title}
              facetCounts={facetCounts}
            />
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
}: SearchFilterProps) {
  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={queryParamKey}
      title={title}
      contentClassName={contentClassName}
      expanded={!!query.size}
      className="width-100"
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
