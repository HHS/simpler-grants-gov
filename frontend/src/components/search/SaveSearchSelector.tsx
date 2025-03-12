"use client";

import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useUser } from "src/services/auth/useUser";
import { obtainSavedSearches } from "src/services/fetch/fetchers/clientSavedSearchFetcher";
import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Select } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";
import Spinner from "src/components/Spinner";

export const SavedSearchSelector = ({
  newSavedSearches,
}: {
  newSavedSearches: string[];
}) => {
  const t = useTranslations("Search.saveSearch");
  const { user } = useUser();
  const { searchParams, replaceQueryParams } = useSearchParamUpdater();

  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>();
  const [savedSearches, setSavedSearches] = useState<SavedSearchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<Error | null>();

  const fetchSavedSearches = useCallback(() => {
    if (user?.token) {
      setLoading(true);
      setApiError(null);
      return obtainSavedSearches(user.token)
        .then((savedSearches) => {
          setLoading(false);
          setSavedSearches(savedSearches);
        })
        .catch((e) => {
          setLoading(false);
          console.error("Error fetching saved searches", e);
          setApiError(e as Error);
        });
    }
    return Promise.resolve();
  }, [user?.token]);

  // note that selected value will be the search id since select values
  // cannot be objects. We then need to look up the the correct search in the list
  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = event?.target?.value;
      setSelectedSavedSearch(selectedId);
      if (selectedId) {
        const searchToApply = savedSearches.find(
          (search) => search.saved_search_id === selectedId,
        )?.search_query;
        if (!searchToApply) {
          setApiError(new Error("Unable to find saved search"));
          return;
        }
        const searchEntries = searchToQueryParams(searchToApply);
        replaceQueryParams(searchEntries);
      }
    },
    [savedSearches],
  );

  // fetch saved searches on page load
  useEffect(() => {
    fetchSavedSearches();
  }, [user?.token, fetchSavedSearches]);

  // fetch saved searches on new saved search
  useEffect(() => {
    if (newSavedSearches.length && fetchSavedSearches) {
      fetchSavedSearches().then(() => {
        // set the latest saved search as selected
        setSelectedSavedSearch(newSavedSearches[0]);
      });
    }
  }, [newSavedSearches.length]);

  // reset saved search selector on search change
  useEffect(() => {
    setSelectedSavedSearch("");
  }, [searchParams]);

  if (loading) {
    return <Spinner />;
  }
  if (apiError) {
    return (
      <SimplerAlert
        type="error"
        buttonId={"saved-search-api-error"}
        messageText={t("fetchSavedError")}
      />
    );
  }
  return (
    <Select
      id="search-sort-by-select"
      name="search-sort-by"
      onChange={handleSelectChange}
      className="tablet:display-inline-block tablet:width-auto"
      value={selectedSavedSearch || 1}
    >
      <option key={1} value={1} disabled>
        {t("defaultSelect")}
      </option>
      {savedSearches.length &&
        savedSearches.map((savedSearch) => (
          <option
            key={savedSearch.saved_search_id}
            value={savedSearch.saved_search_id}
          >
            {savedSearch.name}
          </option>
        ))}
    </Select>
  );
};
