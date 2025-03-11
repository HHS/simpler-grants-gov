"use client";

import { useUser } from "src/services/auth/useUser";
import { obtainSavedSearches } from "src/services/fetch/fetchers/clientSavedSearchFetcher";
import { SavedSearch } from "src/types/search/searchRequestTypes";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Select } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";
import Spinner from "src/components/Spinner";

/* needs to respond to
    * newly added saved search
      - initiate refetch of saved searches
    * update to search params
      - update selected option back to default
*/
export const SavedSearchSelector = ({
  newSavedSearches,
}: {
  newSavedSearches: string[];
}) => {
  const t = useTranslations("Search.saveSearch");
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<Error | null>();

  const fetchSavedSearches = useCallback(() => {
    if (user?.token) {
      setLoading(true);
      setApiError(null);
      return obtainSavedSearches(user.token)
        .then((savedSearches) => {
          console.log("!!! got some savedSearches", savedSearches);
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
  useEffect(() => {
    console.log("~~~ save search selection", selectedSavedSearch);
  }, [selectedSavedSearch]);

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
      onChange={(e) => setSelectedSavedSearch(e?.target?.value)}
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
