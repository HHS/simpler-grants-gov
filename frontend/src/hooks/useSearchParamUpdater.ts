"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
  defaultFilterValues,
  SEARCH_NO_STATUS_VALUE,
} from "src/constants/search";
import { useUser } from "src/services/auth/useUser";
import { FrontendFilterNames } from "src/types/search/searchFilterTypes";
import { ValidSearchQueryParamData } from "src/types/search/searchQueryTypes";
import { addCacheBuster } from "src/utils/cacheBuster";
import { queryParamsToQueryString } from "src/utils/generalUtils";
import { paramsToFormattedQuery } from "src/utils/search/searchUtils";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParamUpdater() {
  const searchParams = useSearchParams() || undefined;
  const pathname = usePathname() || "";
  const router = useRouter();
  const params = new URLSearchParams(searchParams);
  const { user } = useUser();

  // Helper to add cache buster if authenticated
  const withCacheBuster = (url: string) => {
    // Check authentication using user object - must have a token
    const isAuthenticated = !!(user && user.token);
    return isAuthenticated ? addCacheBuster(url) : url;
  };

  const updateQueryParams = (
    queryParamValue: string | Set<string>,
    key: string,
    queryTerm?: string | null,

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
    router.push(
      withCacheBuster(`${pathname}${paramsToFormattedQuery(params)}`),
      { scroll },
    );
  };

  const replaceQueryParams = (
    params: ValidSearchQueryParamData | { savedSearch?: string },
  ) => {
    router.push(
      withCacheBuster(`${pathname}${queryParamsToQueryString(params)}`),
    );
  };

  const setQueryParam = (key: string, value: string, scroll = false) => {
    params.set(key, value);
    router.push(
      withCacheBuster(`${pathname}${paramsToFormattedQuery(params)}`),
      { scroll },
    );
  };

  const setQueryParams = (
    updates: ValidSearchQueryParamData,
    scroll = false,
  ) => {
    Object.entries(updates).forEach(([queryParamKey, queryParamValue]) => {
      params.set(queryParamKey, queryParamValue);
    });

    router.push(
      withCacheBuster(`${pathname}${paramsToFormattedQuery(params)}`),
      { scroll },
    );
  };

  const removeQueryParam = (paramKey: string, scroll = false) => {
    params.delete(paramKey);
    router.push(
      withCacheBuster(`${pathname}${paramsToFormattedQuery(params)}`),
      { scroll },
    );
  };

  const clearQueryParams = (paramsToRemove?: string[]) => {
    const paramsToClear = paramsToRemove || Array.from(params.keys());
    paramsToClear.forEach((paramKey) => {
      params.delete(paramKey);
    });
    router.push(
      withCacheBuster(`${pathname}${paramsToFormattedQuery(params)}`),
    );
  };

  const removeQueryParamValue = (
    queryParamKey: FrontendFilterNames,
    queryParamValue: string,
  ) => {
    const paramToEdit = searchParams.get(queryParamKey);
    const defaultValues = defaultFilterValues[queryParamKey];

    if (!paramToEdit && !defaultValues) {
      return;
    }

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
