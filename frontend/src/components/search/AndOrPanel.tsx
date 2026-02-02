"use client";

import { andOrOptions } from "src/constants/searchFilterOptions";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { QueryContext } from "src/services/search/QueryProvider";

import { useCallback, useContext } from "react";

import { SearchFilterRadio } from "./SearchFilterRadio";

export function AndOrPanel({ hasSearchTerm }: { hasSearchTerm: boolean }) {
  const { setQueryParam } = useSearchParamUpdater();

  const { localAndOrParam, updateLocalAndOrParam } = useContext(QueryContext);

  const toggleAndOrSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // when a search term is present, we're good with re-running the search with the new and/or
      if (hasSearchTerm) {
        updateLocalAndOrParam(event.target.value);
        return setQueryParam("andOr", event.target.value);
      }
      // if a search term isn't present, queue up the and/or value to be applied when we run the next search
      updateLocalAndOrParam(event.target.value);
    },
    [hasSearchTerm, setQueryParam, updateLocalAndOrParam],
  );

  return andOrOptions.map((option) => {
    return (
      <SearchFilterRadio
        className="bg-base-lightest"
        key={option.value}
        id={option.id}
        name={option.value}
        label={option.label}
        onChange={toggleAndOrSelection}
        value={option.value}
        checked={
          !localAndOrParam
            ? option.value === "AND"
            : localAndOrParam === option.value
        }
      />
    );
  });
}
