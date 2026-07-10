"use client";

import { savedOpportunityStatusOptions } from "src/constants/searchFilterOptions";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Select } from "@trussworks/react-uswds";

interface SavedOpportunityStatusFilterProps {
  status: string | null;
}

export default function SavedOpportunityStatusFilter({
  status,
}: SavedOpportunityStatusFilterProps) {
  const { setQueryParam, removeQueryParam } = useSearchParamUpdater();
  const t = useTranslations("SavedOpportunities");

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      if (newValue) {
        setQueryParam("status", newValue);
      } else {
        removeQueryParam("status");
      }
    },
    [setQueryParam, removeQueryParam],
  );

  return (
    <div id="saved-opportunity-status-filter">
      <label
        htmlFor="saved-opportunity-status-select"
        className="usa-label tablet:display-inline-block tablet:margin-right-2"
      >
        {t("statusFilter.label")}
      </label>

      <Select
        id="saved-opportunity-status-select"
        name="saved-opportunity-status"
        onChange={handleChange}
        value={status || ""}
        className="tablet:display-inline-block tablet:width-auto"
      >
        {savedOpportunityStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
