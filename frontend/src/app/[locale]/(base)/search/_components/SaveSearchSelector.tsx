import clsx from "clsx";
import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import { usePrevious } from "src/hooks/usePrevious";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useUser } from "src/services/auth/useUser";
import { QueryContext } from "src/services/search/QueryProvider";
import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { searchToQueryParams } from "src/utils/search/searchFormatUtils";

import { useTranslations } from "next-intl";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Select } from "@trussworks/react-uswds";

import SimplerAlert from "src/components/SimplerAlert";
import Spinner from "src/components/Spinner";

export const SaveSearchSelector = ({
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
  const { searchParams, replaceQueryParams, removeQueryParam } =
    useSearchParamUpdater();
  const prevSearchParams = usePrevious(searchParams);
  const { updateQueryTerm } = useContext(QueryContext);
  const { clientFetch } = useClientFetch<SavedSearchRecord[]>(
    "Error fetching saved searches",
  );

  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [runPostFetchActions, setRunPostFetchActions] =
    useState<boolean>(false);
  const [apiError, setApiError] = useState<Error | null>();

  const fetchSavedSearches = useCallback(() => {
    if (!user?.token) {
      setApiError(new Error("Not logged in, can't fetch saved searches"));
    }
    setLoading(true);
    setApiError(null);
    return clientFetch("/api/user/saved-searches/list", {
      method: "POST",
    })
      .then((savedSearches) => {
        setLoading(false);
        setSavedSearches(savedSearches);
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching saved searches", error);
        setApiError(error as Error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, setSavedSearches]);

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
        replaceQueryParams({ ...searchQueryParams, savedSearch: selectedId });
        updateQueryTerm(searchQueryParams.query || "");
      }
    },
    [savedSearches, replaceQueryParams, updateQueryTerm],
  );

  // fetch saved searches on page load, log in, or on any new saved search
  // not explicitly dependent on user changes, but fetchSavedSearches is, so will still fire
  useEffect(() => {
    fetchSavedSearches()
      .then(() => setRunPostFetchActions(true))
      .catch(noop);
  }, [fetchSavedSearches, newSavedSearches]);

  // run post fetch action effect to set select with correct value after fetch
  // split this out from the fetch useEffect so that we wouldn't have to deal with the
  // extra triggers there
  useEffect(() => {
    if (runPostFetchActions) {
      const savedSearchQueryValue = searchParams.get("savedSearch");
      const savedSearchToSetInSelectAfterFetch =
        savedSearchQueryValue ||
        (newSavedSearches.length && newSavedSearches[0]);
      if (savedSearchToSetInSelectAfterFetch) {
        setSelectedSavedSearch(savedSearchToSetInSelectAfterFetch);
      }
      setRunPostFetchActions(false);
    }
  }, [runPostFetchActions, searchParams, newSavedSearches, removeQueryParam]);

  /*
    If a user has selected a saved search, and then updates their filter / search options
    we need to reset the selected saved search option.

    We cannot simply do this by looking at inequality of previous and current search params though,
    as this sort of condition will be hit in the process of applying a saved search, and we'd end up
    resetting the selected state while selecting a search.

    With the conditions here we can ensure we are only clearing a saved search:
    * when search params are changing
    * the process of applying a saved search is fully completed, as proven by both current and
      previous search params containing the saved search param
  */

  useEffect(() => {
    if (
      searchParams !== prevSearchParams &&
      searchParams.get("savedSearch") &&
      prevSearchParams?.get("savedSearch")
    ) {
      setSelectedSavedSearch("");
      removeQueryParam("savedSearch");
    }
  }, [searchParams, prevSearchParams, removeQueryParam]);

  if (apiError) {
    return (
      <SimplerAlert
        type="error"
        buttonId={"saved-search-api-error"}
        messageText={t("fetchSavedError")}
        alertClick={() => setApiError(null)}
      />
    );
  }
  if (loading) {
    return <Spinner />;
  }
  // hide if no saved searches available
  if (!savedSearches.length) {
    return;
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
