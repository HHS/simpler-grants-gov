"use client";

import { sendGAEvent } from "@next/third-parties/google";
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

  const replaceQueryParams = (params: ValidSearchQueryParamData) => {
    router.push(`${pathname}${queryParamsToQueryString(params)}`);
  };

  const setQueryParam = (key: string, value: string, scroll = false) => {
    params.set(key, value);
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

  // const setStaticQueryParam = (key: string, value: string) => {
  //   params.set(key, value);
  //   window.history.pushState(
  //     null,
  //     "",
  //     `${pathname}${paramsToFormattedQuery(params)}`,
  //   );
  // };

  // updates local query params but does not navigate
  // queued query param update will be applied during next call to
  // any other useSearchParamUpdater function
  // returns the local params state
  const setQueuedQueryParam = (key: string, value: string) => {
    params.set(key, value);
    return params;
  };

  console.log("$$$ local params", params);
  return {
    searchParams,
    updateQueryParams,
    replaceQueryParams,
    removeQueryParam,
    setQueryParam,
    clearQueryParams,
    // setStaticQueryParam,
    setQueuedQueryParam,
    // localParams: params,
  };
}
