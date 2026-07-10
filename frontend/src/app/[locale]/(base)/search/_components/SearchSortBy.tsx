"use client";

import { sortOptions } from "src/constants/searchFilterOptions";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Select } from "@trussworks/react-uswds";

interface SearchSortByProps {
  queryTerm: string | null | undefined;
  sortby: string | null;
  drawer?: boolean;
}

export default function SearchSortBy({
  queryTerm,
  sortby,
  drawer,
}: SearchSortByProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const t = useTranslations("Search");

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      updateQueryParams(newValue, "sortby", queryTerm);
    },
    [queryTerm, updateQueryParams],
  );

  const selectId = `search-sort-by-select${drawer ? "-drawer" : ""}`;

  return (
    <div id={`search-sort-by${drawer ? "-drawer" : ""}`}>
      <label
        htmlFor={selectId}
        className="usa-label tablet:display-inline-block tablet:margin-right-2"
      >
        {t("sortBy.label")}
      </label>

      <Select
        id={selectId}
        name="search-sort-by"
        onChange={handleChange}
        value={sortby || ""}
        className="tablet:display-inline-block tablet:width-auto"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
