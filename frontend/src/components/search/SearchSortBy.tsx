"use client";

import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { SortOption } from "src/services/search/searchfetcher/SearchFetcher";

import { useTranslations } from "next-intl";
import { useContext } from "react";
import { Select } from "@trussworks/react-uswds";

interface SearchSortByProps {
  queryTerm: string | null | undefined;
  sortby: string | null;
  totalResults: string;
}

export default function SearchSortBy({
  queryTerm,
  sortby,
  totalResults,
}: SearchSortByProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const { updateTotalResults } = useContext(QueryContext);
  const t = useTranslations("Search");

  const SORT_OPTIONS: SortOption[] = [
    {
      label: t("sortBy.options.default"),
      value: "relevancy",
    },
    { label: t("sortBy.options.posted_date_desc"), value: "postedDateDesc" },
    { label: t("sortBy.options.posted_date_asc"), value: "postedDateAsc" },
    { label: t("sortBy.options.close_date_desc"), value: "closeDateDesc" },
    { label: t("sortBy.options.close_date_asc"), value: "closeDateAsc" },
    {
      label: t("sortBy.options.opportunity_title_asc"),
      value: "opportunityTitleAsc",
    },
    {
      label: t("sortBy.options.opportunity_title_desc"),
      value: "opportunityTitleDesc",
    },
    { label: t("sortBy.options.agency_asc"), value: "agencyAsc" },
    { label: t("sortBy.options.agency_desc"), value: "agencyDesc" },
    {
      label: t("sortBy.options.opportunity_number_desc"),
      value: "opportunityNumberDesc",
    },
    {
      label: t("sortBy.options.opportunity_number_asc"),
      value: "opportunityNumberAsc",
    },
  ];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    updateTotalResults(totalResults);
    updateQueryParams(newValue, "sortby", queryTerm);
  };

  return (
    <div id="search-sort-by">
      <label htmlFor="search-sort-by-select" className="usa-sr-only">
        {t("sortBy.label")}
      </label>

      <Select
        id="search-sort-by-select"
        name="search-sort-by"
        onChange={handleChange}
        value={sortby || ""}
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
