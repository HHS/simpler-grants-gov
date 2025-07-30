"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
  defaultFilterValues,
  SEARCH_NO_STATUS_VALUE,
} from "src/constants/search";
import { FrontendFilterNames } from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParamData } from "src/types/search/searchQueryTypes";
import { queryParamsToQueryString } from "src/utils/generalUtils";
import { paramsToFormattedQuery } from "src/utils/search/searchUtils";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParamUpdater() {
  const searchParams = useSearchParams() || undefined;
  const pathname = usePathname() || "";
  const router = useRouter();
  const params = new URLSearchParams(searchParams);

  // note that providing an empty string as `queryParamValue` will remove the param.
  // also note that "query" is the name of a query param, but it is being handled separately
  // in this implementation. To set a new keyword query in the url without touching other params,
  // you can use a call such as `updateQueryParams("", "query", queryTerm)`.
  const updateQueryParams = (
    // The parameter value that is not the query term. Query term is treated
    // separately because updates to it are captured, ie if a user updates the
    // search term and then clicks a facet, the updated term is used.
    queryParamValue: string | Set<string>,
    // Key of the parameter.
    key: string,
    queryTerm?: string | null,
    // Determines whether the state update scrolls the user to the top. This
    // is useful for components that are expected to be "under the fold."
    scroll = false,
  ) => {
    const finalQueryParamValue =
      queryParamValue instanceof Set
        ? Array.from(queryParamValue).join(",")
        : queryParamValue;

    if (finalQueryParamValue) {
      params.set(key, finalQueryParamValue);
    } else {
      params.delete(key);
    }
    if (queryTerm) {
      params.set("query", queryTerm);
    } else {
      params.delete("query");
    }
    if (key !== "page") {
      params.delete("page");
    }

    sendGAEvent("event", "search_term", { key: finalQueryParamValue });
    router.push(`${pathname}${paramsToFormattedQuery(params)}`, { scroll });
  };

  const replaceQueryParams = (
    params: ValidSearchQueryParamData | { savedSearch?: string },
  ) => {
    router.push(`${pathname}${queryParamsToQueryString(params)}`);
  };

  const setQueryParam = (key: string, value: string, scroll = false) => {
    params.set(key, value);
    router.push(`${pathname}${paramsToFormattedQuery(params)}`, { scroll });
  };

  const setQueryParams = (
    updates: ValidSearchQueryParamData,
    scroll = false,
  ) => {
    Object.entries(updates).forEach(([queryParamKey, queryParamValue]) => {
      params.set(queryParamKey, queryParamValue);
    });

    router.push(`${pathname}${paramsToFormattedQuery(params)}`, { scroll });
  };

  const removeQueryParam = (paramKey: string, scroll = false) => {
    params.delete(paramKey);
    router.push(`${pathname}${paramsToFormattedQuery(params)}`, { scroll });
  };

  const clearQueryParams = (paramsToRemove?: string[]) => {
    const paramsToClear = paramsToRemove || Array.from(params.keys());
    paramsToClear.forEach((paramKey) => {
      params.delete(paramKey);
    });
    router.push(`${pathname}${paramsToFormattedQuery(params)}`);
  };

  const removeQueryParamValue = (
    queryParamKey: FrontendFilterNames,
    queryParamValue: string,
  ) => {
    const paramToEdit = searchParams.get(queryParamKey);
    const defaultValues = defaultFilterValues[queryParamKey];
    // if no param value is present but default values are, we can remove a default value
    // that is in place though not explicitly set in the query params
    // ex. removing forecasted status from default /search state
    if (!paramToEdit && !defaultValues) {
      return;
    }
    // note that this default case will never be hit due to the early return
    // but ts isn't quite smart enough to realize, so adding the [] to satisfy the compiler
    const paramValues = paramToEdit
      ? paramToEdit.split(",")
      : defaultValues || [];
    const indexOfValueToRemove = paramValues.indexOf(queryParamValue);
    paramValues.splice(indexOfValueToRemove, 1);
    if (!paramValues.length && defaultValues) {
      return setQueryParam(queryParamKey, SEARCH_NO_STATUS_VALUE);
    }
    setQueryParam(queryParamKey, paramValues.join(","));
  };

  return {
    searchParams,
    updateQueryParams,
    replaceQueryParams,
    removeQueryParam,
    setQueryParam,
    clearQueryParams,
    setQueryParams,
    removeQueryParamValue,
  };
}
