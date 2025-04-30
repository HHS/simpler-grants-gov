"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { SortOption } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Select } from "@trussworks/react-uswds";

interface SearchSortByProps {
  queryTerm: string | null | undefined;
  sortby: string | null;
}

export default function SearchSortBy({ queryTerm, sortby }: SearchSortByProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const t = useTranslations("Search");

  const SORT_OPTIONS: SortOption[] = [
    {
      label: t("sortBy.options.default"),
      value: "relevancy",
    },
    { label: t("sortBy.options.postedDateDesc"), value: "postedDateDesc" },
    { label: t("sortBy.options.postedDateAsc"), value: "postedDateAsc" },
    { label: t("sortBy.options.closeDateDesc"), value: "closeDateDesc" },
    { label: t("sortBy.options.closeDateAsc"), value: "closeDateAsc" },
    {
      label: t("sortBy.options.opportunityTitleAsc"),
      value: "opportunityTitleAsc",
    },
    {
      label: t("sortBy.options.opportunityTitleDesc"),
      value: "opportunityTitleDesc",
    },
    { label: t("sortBy.options.agencyAsc"), value: "agencyAsc" },
    { label: t("sortBy.options.agencyDesc"), value: "agencyDesc" },
    {
      label: t("sortBy.options.opportunityNumberDesc"),
      value: "opportunityNumberDesc",
    },
    {
      label: t("sortBy.options.opportunityNumberAsc"),
      value: "opportunityNumberAsc",
    },
  ];

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      updateQueryParams(newValue, "sortby", queryTerm);
    },
    [queryTerm, updateQueryParams],
  );

  return (
    <div id="search-sort-by">
      <label
        htmlFor="search-sort-by-select"
        className="usa-label tablet:display-inline-block tablet:margin-right-2"
      >
        {t("sortBy.label")}
      </label>

      <Select
        id="search-sort-by-select"
        name="search-sort-by"
        onChange={handleChange}
        value={sortby || ""}
        className="tablet:display-inline-block tablet:width-auto"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
