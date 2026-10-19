"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { OptionalStringDict } from "src/types/generalTypes";
import { searchFilterNames } from "src/types/search/searchFilterTypes";
import { expectedQueryParamKeys } from "src/types/search/searchQueryTypes";
import {
  NewRelicSearchAttemptAttributes,
  sendNewRelicSearchAttempt,
  waitForNewRelic,
} from "src/utils/analyticsUtil";

import { useEffect, useState } from "react";

const getCurrentFilters = (params: OptionalStringDict): string => {
  const { query: _query, page: _page, ...withoutQueryAndPage } = params;
  return JSON.stringify(withoutQueryAndPage);
};

// only active, approved query params are sent to NR, prefixed with `search_param_`
// using underscores since NR has problems with querying fields with dashes.
// Built in allow list order so that the same search state always serializes the same way
const getNewRelicSearchAttemptAttributes = (
  params: OptionalStringDict,
): NewRelicSearchAttemptAttributes => {
  const attributes = expectedQueryParamKeys.reduce((activeParams, key) => {
    const value = params[key];
    if (value) {
      activeParams[`search_param_${key}`] = value;
    }
    return activeParams;
  }, {} as NewRelicSearchAttemptAttributes);
  // New relic does not support certain functionalities such as calculating string
  // lengths. This is needed to log and gain insights into search query length.
  attributes.search_param_query_length = params.query?.length ?? 0;
  // number of user facing filter categories in use, regardless of how many values each has selected.
  // agency and topLevelAgency are both set from the Agency filter, so they count as one category
  attributes.search_filter_count = new Set(
    searchFilterNames
      .filter((filterName) => params[filterName])
      .map((filterName) =>
        filterName === "topLevelAgency" ? "agency" : filterName,
      ),
  ).size;
  return attributes;
};

// send custom New Relic and GA data for search pages
function SearchAnalytics({
  params,
  newRelicEnabled,
}: {
  params: OptionalStringDict;
  newRelicEnabled: boolean;
}) {
  const [newRelicInitialized, setNewRelicInitialized] = useState(false);

  useEffect(() => {
    if (!newRelicEnabled) {
      return;
    }
    waitForNewRelic()
      .then((ready) => setNewRelicInitialized(!!ready))
      .catch((e) => console.error("Error waiting for new relic", e));
  }, [newRelicEnabled]);

  // serialized so that a new event is only sent when the search state changes,
  // not when the same params are received as a new object
  const searchAttemptAttributes = JSON.stringify(
    getNewRelicSearchAttemptAttributes(params),
  );

  // send one new relic search_attempt event per search state
  useEffect(() => {
    if (!newRelicEnabled || !newRelicInitialized) {
      return;
    }
    sendNewRelicSearchAttempt(
      JSON.parse(searchAttemptAttributes) as NewRelicSearchAttemptAttributes,
    );
  }, [searchAttemptAttributes, newRelicEnabled, newRelicInitialized]);

  useEffect(() => {
    // send list of filters defined in page query params on each page load
    sendGAEvent("event", "search_attempt", {
      search_filters: getCurrentFilters(params),
    });
  }, [params]);
  return <></>;
}

export default SearchAnalytics;
