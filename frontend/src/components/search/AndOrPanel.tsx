"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useCallback } from "react";

import { andOrOptions } from "./SearchFilterAccordion/SearchFilterOptions";
import { SearchFilterRadio } from "./SearchFilterRadio";

export function AndOrPanel({
  hasSearchTerm,
  andOrParam,
}: {
  hasSearchTerm: boolean;
  andOrParam: Set<string>;
}) {
  const { setStaticQueryParam, setQueryParam } = useSearchParamUpdater();

  const toggleAndOrSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (hasSearchTerm) {
        return setQueryParam("andOr", event.target.value);
      }
      setStaticQueryParam("andOr", event.target.value);
    },
    [hasSearchTerm],
  );

  return andOrOptions.map((option) => {
    return (
      <SearchFilterRadio
        id={option.id}
        name={option.value}
        label={option.label}
        onChange={toggleAndOrSelection}
        value={option.value}
        checked={
          option.value === "and"
            ? !andOrParam.size || andOrParam.has(option.value)
            : andOrParam.has(option.value)
        }
      />
    );
  });

  // return (
  //   <div>
  //     <SearchFilterRadio
  //       id="andOr-"
  //       name={`Any ${title}`}
  //       label={`Any ${title.toLowerCase()}`}
  //       onChange={toggleAndOrSelection}
  //       value={undefined}
  //       facetCount={undefined}
  //       checked={isNoneSelected}
  //     />
  //     <SearchFilterRadio />
  //   </div>
  // );
}
