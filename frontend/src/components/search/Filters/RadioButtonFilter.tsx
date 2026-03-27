"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useMemo } from "react";

import {
  BasicSearchFilterAccordion,
  SearchFilterProps,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { SearchFilterRadio } from "src/components/search/SearchFilterRadio";

export function RadioButtonFilter({
  query,
  queryParamKey,
  title,
  includeAnyOption = true,
  filterOptions,
  facetCounts,
  contentClassName,
}: SearchFilterProps) {
  const { setQueryParam } = useSearchParamUpdater();

  const toggleRadioSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQueryParam(queryParamKey, event.target.value);
  };

  const isNoneSelected = useMemo(() => query.size === 0, [query]);

  return (
    <BasicSearchFilterAccordion
      query={query}
      queryParamKey={queryParamKey}
      title={title}
      expanded={!!query.size}
      className="width-100"
      contentClassName={contentClassName}
    >
      <div data-testid={`${title}-filter`}>
        <ul className="usa-list usa-list--unstyled">
          {includeAnyOption && (
            <li>
              <SearchFilterRadio
                id={`${title}-any-radio`}
                name={`Any ${title}`}
                label={`Any ${title.toLowerCase()}`}
                onChange={toggleRadioSelection}
                value={undefined}
                facetCount={undefined}
                checked={isNoneSelected}
              />
            </li>
          )}
          {filterOptions.map((option) => (
            <li key={option.id}>
              <SearchFilterRadio
                id={option.id}
                name={option.label}
                label={option.label}
                onChange={toggleRadioSelection}
                value={option.value}
                facetCount={facetCounts && (facetCounts?.[option.value] || 0)}
                checked={query.has(option.value)}
              />
            </li>
          ))}
        </ul>
      </div>
    </BasicSearchFilterAccordion>
  );
}
