import clsx from "clsx";
import { usePrevious } from "src/hooks/usePrevious";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useUser } from "src/services/auth/useUser";
import { obtainSavedSearches } from "src/services/fetch/fetchers/clientSavedSearchFetcher";
import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { useTranslations } from "next-intl";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Select } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";
import Spinner from "src/components/Spinner";

export const SavedSearchSelector = ({
  newSavedSearches,
  savedSearches,
  setSavedSearches,
}: {
  newSavedSearches: string[];
  savedSearches: SavedSearchRecord[];
  setSavedSearches: Dispatch<SetStateAction<SavedSearchRecord[]>>;
}) => {
  const t = useTranslations("Search.saveSearch");
  const { user } = useUser();
  const { searchParams, replaceQueryParams } = useSearchParamUpdater();
  const prevSearchParams = usePrevious(searchParams);

  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<Error | null>();

  // allows us to avoid resetting the select option when params change after selection
  const [applyingSavedSearch, setApplyingSavedSearch] =
    useState<boolean>(false);

  const handleFetchError = useCallback((e: Error) => {
    setLoading(false);
    console.error("Error fetching saved searches", e);
    setApiError(e);
  }, []);

  const fetchSavedSearches = useCallback(() => {
    if (user?.token) {
      setLoading(true);
      setApiError(null);
      return obtainSavedSearches(user.token)
        .then((savedSearches) => {
          setLoading(false);
          setSavedSearches(savedSearches);
        })
        .catch(handleFetchError);
    }
    return Promise.resolve();
  }, [user?.token, handleFetchError, setSavedSearches]);

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
        const searchQueryParams = searchToQueryParams(searchToApply);
        setApplyingSavedSearch(true);
        replaceQueryParams(searchQueryParams);
      }
    },
    [savedSearches, replaceQueryParams],
  );

  // fetch saved searches on page load or log in
  useEffect(() => {
    fetchSavedSearches().catch(handleFetchError);
  }, [user?.token, fetchSavedSearches, handleFetchError]);

  // fetch saved searches on new saved search
  useEffect(() => {
    if (newSavedSearches.length && fetchSavedSearches) {
      fetchSavedSearches()
        .then(() => {
          // set the latest saved search as selected
          setSelectedSavedSearch(newSavedSearches[0]);
        })
        .catch(handleFetchError);
    }
  }, [handleFetchError, fetchSavedSearches, newSavedSearches]);

  // reset saved search selector on search change
  useEffect(() => {
    // we want to display the name of selected saved search on selection, so opt out of clearing during apply
    if (!applyingSavedSearch && searchParams !== prevSearchParams) {
      setSelectedSavedSearch("");
    }
  }, [searchParams, prevSearchParams, applyingSavedSearch]);

  // clear applying saved flag when searchParams change
  useEffect(() => {
    setApplyingSavedSearch(false);
  }, [searchParams]);

  // hide if no saved searches available
  if (!savedSearches.length) {
    return;
  }
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
      id="save-search-select"
      name="save-search"
      onChange={handleSelectChange}
      className={clsx({
        "margin-bottom-2": true,
        "bg-primary-lightest": !!selectedSavedSearch,
        "border-primary-dark": !!selectedSavedSearch,
      })}
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
