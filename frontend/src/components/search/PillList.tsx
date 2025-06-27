"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { FilterPillLabelData } from "src/types/search/searchFilterTypes";

import { Pill } from "src/components/Pill";

// includes a loading indicator and a hidden pill list with one item to set the proper height for a single row of pills
// if the page has more filters applied than will fit in one row this won't work but with one row of pills it prevents bounce on load
export function PillListSkeleton() {
  return (
    <div className="display-flex">
      <div className="flex-1 flex-align-self-center">Loading...</div>
      <div className="opacity-0 flex-1">
        <PillList
          pills={[
            {
              label: "",
              queryParamKey: "status",
              queryParamValue: "",
            },
          ]}
        />
      </div>
    </div>
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
              className="margin-x-1 margin-top-2 display-inline-block"
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
