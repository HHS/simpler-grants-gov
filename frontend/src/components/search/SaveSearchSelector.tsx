"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Select } from "@trussworks/react-uswds";

export const SavedSearchSelector = () => {
  const t = useTranslations("Search.saveSearch");
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<unknown>();
  useEffect(() => {
    console.log("~~~ save search selection", selectedSavedSearch);
  }, [selectedSavedSearch]);
  return (
    <Select
      id="search-sort-by-select"
      name="search-sort-by"
      // defaultValue={t("defaultSelect")}
      onChange={(e) => setSelectedSavedSearch(e?.target?.value)}
      className="tablet:display-inline-block tablet:width-auto"
    >
      {/* {fetchedSavedSearches.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))} */}
      <option key={1} value={1} disabled selected>
        {t("defaultSelect")}
      </option>
      <option key={2} value={2}>
        TEST
      </option>
    </Select>
  );
};
