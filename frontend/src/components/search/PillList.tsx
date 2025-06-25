"use client";

import { FilterPillLabelData } from "src/types/search/searchFilterTypes";

import { Pill } from "../Pill";

export function PillList({ pills }: { pills: FilterPillLabelData[] }) {
  return (
    <>
      {pills?.length
        ? pills.map(({ queryParamKey, queryParamValue, label }) => (
            <Pill
              key={`pill-for-${label}`}
              label={label}
              onClose={() =>
                console.log("!!! close", queryParamKey, queryParamValue)
              }
            />
          ))
        : ""}
    </>
  );
}
