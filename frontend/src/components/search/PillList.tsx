"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterPillLabelData } from "src/types/search/searchFilterTypes";

import { Pill } from "src/components/Pill";

// if the page has more filters applied than will fit in one row this won't work but with one row of pills it prevents bounce on load
export function PillListSkeleton() {
  return (
    <div className="display-flex flex-align-center minh-8">Loading...</div>
  );
}

export function PillList({ pills }: { pills: FilterPillLabelData[] }) {
  const { removeQueryParamValue } = useSearchParamUpdater();
  return (
    <>
      {pills?.length
        ? pills.map(({ queryParamKey, queryParamValue, label }) => (
            <div
              key={`pill-for-${label}`}
              className="margin-x-1 margin-bottom-2 display-inline-block"
            >
              <Pill
                label={label}
                onClose={() =>
                  removeQueryParamValue(queryParamKey, queryParamValue)
                }
              />
            </div>
          ))
        : ""}
    </>
  );
}
