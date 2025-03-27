"use client";

import { SEARCH_NO_STATUS_VALUE } from "src/constants/search";

import { useTranslations } from "next-intl";

import SearchFilterAccordion, {
  FilterOption,
} from "./SearchFilterAccordion/SearchFilterAccordion";

interface SearchOpportunityStatusProps {
  query: Set<string>;
  facetCounts: { [key: string]: number };
}

export default function SearchOpportunityStatus({
  query,
  facetCounts,
}: SearchOpportunityStatusProps) {
  const t = useTranslations("Search.accordion");
  const defaultEmptySelection = new Set([SEARCH_NO_STATUS_VALUE]);

  const statusOptions: FilterOption[] = [
    {
      id: "status-forecasted",
      label: t("options.status.forecasted"),
      value: "forecasted",
    },
    {
      id: "status-posted",
      label: t("options.status.posted"),
      value: "posted",
    },
    {
      id: "status-closed",
      label: t("options.status.closed"),
      value: "closed",
    },
    {
      id: "status-archived",
      label: t("options.status.archived"),
      value: "archived",
    },
  ];

  return (
    <SearchFilterAccordion
      filterOptions={statusOptions}
      query={query}
      queryParamKey="status"
      title={t("titles.status")}
      facetCounts={facetCounts}
      defaultEmptySelection={defaultEmptySelection}
    />
  );
}
