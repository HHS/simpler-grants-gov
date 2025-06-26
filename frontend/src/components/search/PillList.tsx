"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterPillLabelData } from "src/types/search/searchFilterTypes";

import { Pill } from "src/components/Pill";

export function PillList({ pills }: { pills: FilterPillLabelData[] }) {
  const { removeQueryParamValue } = useSearchParamUpdater();
  return (
    <>
      {pills?.length
        ? pills.map(({ queryParamKey, queryParamValue, label }) => (
            <div
              key={`pill-for-${label}`}
              className="margin-x-1 margin-top-2 display-inline-block"
            >
              <Pill
                label={label}
                onClose={() => {
                  console.log("!!! close", queryParamKey, queryParamValue);
                  removeQueryParamValue(queryParamKey, queryParamValue);
                }}
              />
            </div>
          ))
        : ""}
    </>
  );
}
