"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useCallback, useMemo, useState } from "react";

import { andOrOptions } from "./SearchFilterAccordion/SearchFilterOptions";
import { SearchFilterRadio } from "./SearchFilterRadio";

export function AndOrPanel({
  hasSearchTerm,
  andOrParam,
}: {
  hasSearchTerm: boolean;
  andOrParam: Set<string>;
}) {
  const {
    // setStaticQueryParam,
    setQueryParam,
    setQueuedQueryParam,
    // localParams,
  } = useSearchParamUpdater();

  const [localAndOrParam, setLocalAndOrParam] = useState<string | null>(
    andOrParam.has("or") ? "or" : "and",
  );

  // const andOrParam = localParams.get("andOr");

  const toggleAndOrSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (hasSearchTerm) {
        setLocalAndOrParam(event.target.value);
        return setQueryParam("andOr", event.target.value);
      }
      const localParams = setQueuedQueryParam("andOr", event.target.value);
      setLocalAndOrParam(localParams?.get("andOr"));
      // setStaticQueryParam("andOr", event.target.value);
      // return setQueryParam("andOr", event.target.value);
    },
    [hasSearchTerm],
  );

  const checkedOptionValue = useMemo(() => {
    if (!localAndOrParam || localAndOrParam === "and") {
      return "and";
    }
    return "or";
  }, [localAndOrParam]);

  console.log("$$$ memo", checkedOptionValue);
  return andOrOptions.map((option) => {
    console.log("$$$", option.value, localAndOrParam);
    return (
      <SearchFilterRadio
        key={option.value}
        id={option.id}
        name={option.value}
        label={option.label}
        onChange={toggleAndOrSelection}
        value={option.value}
        checked={option.value === checkedOptionValue}
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
