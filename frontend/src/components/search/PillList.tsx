"use client";

import { FilterPillLabelData } from "src/types/search/searchFilterTypes";

import { Pill } from "src/components/Pill";

export function PillList({ pills }: { pills: FilterPillLabelData[] }) {
  return (
    <>
      {pills?.length
        ? pills.map(({ queryParamKey, queryParamValue, label }) => (
            <div
              key={`pill-for-${label}`}
              className="margin-x-1 margin-y-2 display-inline-block"
            >
              <Pill
                label={label}
                onClose={() =>
                  console.log("!!! close", queryParamKey, queryParamValue)
                }
              />
            </div>
          ))
        : ""}
    </>
  );
}
