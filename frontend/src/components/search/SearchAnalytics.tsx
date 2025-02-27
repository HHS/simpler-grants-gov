"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { omit } from "lodash";
import { SearchParamsTypes } from "src/types/search/searchRequestTypes";
import { validSearchQueryParamKeys } from "src/types/search/searchResponseTypes";
import {
  setNewRelicCustomAttribute,
  unsetAllNewRelicQueryAttributes,
  waitForNewRelic,
} from "src/utils/analyticsUtil";

import { useEffect, useState } from "react";

const getCurrentFilters = (params: SearchParamsTypes): string => {
  return JSON.stringify(omit(params, "query", "page"));
};

// send custom New Relic and GA data for search pages
function SearchAnalytics({
  params,
  newRelicEnabled,
}: {
  params: SearchParamsTypes;
  newRelicEnabled: boolean;
}) {
  const [newRelicInitialized, setNewRelicInitialized] = useState(false);

  useEffect(() => {
    if (!newRelicEnabled) {
      return;
    }
    const ready = waitForNewRelic();
    setNewRelicInitialized(!!ready);
  }, [newRelicEnabled]);

  // set new relic query param based custom attributes
  useEffect(() => {
    if (!newRelicEnabled || !newRelicInitialized) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // only pass on valid query params to NR
        if ((validSearchQueryParamKeys as readonly string[]).includes(key)) {
          setNewRelicCustomAttribute(key, value || "");
        }
      });
    }
    // note that this cleanup is not running quickly enough to prevent search query params
    // being sent on route transition when navigating away from the search page
    return () => {
      unsetAllNewRelicQueryAttributes();
    };
  }, [params, newRelicEnabled, newRelicInitialized]);

  //
  useEffect(() => {
    // send list of filters defined in page query params on each page load
    sendGAEvent("event", "search_attempt", {
      search_filters: getCurrentFilters(params),
    });
  }, [params]);
  return <></>;
}

export default SearchAnalytics;
