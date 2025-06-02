"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";

import { useContext, useMemo } from "react";

import {
  BasicSearchFilterAccordion,
  SearchFilterAccordionProps,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";
import { SearchFilterRadio } from "src/components/search/SearchFilterRadio";

export function RadioButtonFilter({
  query,
  queryParamKey,
  title,
  wrapForScroll = true,
  includeAnyOption = true,
  filterOptions,
  facetCounts,
}: SearchFilterAccordionProps) {
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
      wrapForScroll={wrapForScroll}
      expanded={!!query.size}
      className="width-100 padding-right-5"
    >
      <div data-testid={`${title}-filter`}>
        <ul className="usa-list usa-list--unstyled">
          {includeAnyOption && (
            <li>
              <SearchFilterRadio
                id={`${title}-any-radio`}
                name={`Any ${title}`}
                label={`Any ${title}`}
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
                facetCount={facetCounts?.[option.value] || 0}
              />
            </li>
          ))}
        </ul>
      </div>
    </BasicSearchFilterAccordion>
  );
}
