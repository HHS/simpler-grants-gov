"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { environment } from "src/constants/environments";
import { OptionalStringDict } from "src/types/generalTypes";
import { searchFilterNames } from "src/types/search/searchFilterTypes";
import { expectedQueryParamKeys } from "src/types/search/searchQueryTypes";
import {
  NewRelicSearchAttemptAttributes,
  sendNewRelicSearchAttempt,
  waitForNewRelic,
} from "src/utils/analyticsUtil";
// TEMPORARY #12725
import {
  installNrDebug12725,
  isNrDebug12725Enabled,
  nrDebug12725Log,
} from "src/utils/newRelicDebug12725";

import { useEffect, useState } from "react";

const getCurrentFilters = (params: OptionalStringDict): string => {
  const { query: _query, page: _page, ...withoutQueryAndPage } = params;
  return JSON.stringify(withoutQueryAndPage);
};

// Built in allowlist order so equivalent search states serialize identically.
// Using underscores since NR has problems with querying fields with dashes.
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
  // NRQL can't calculate string lengths, so send the query length directly.
  attributes.search_param_query_length = params.query?.length ?? 0;
  // agency and topLevelAgency are one user-facing Agency filter.
  attributes.search_filter_count = new Set(
    searchFilterNames
      .filter((filterName) => params[filterName])
      .map((filterName) =>
        filterName === "topLevelAgency" ? "agency" : filterName,
      ),
  ).size;
  return attributes;
};

function SearchAnalytics({
  params,
  newRelicEnabled,
}: {
  params: OptionalStringDict;
  newRelicEnabled: boolean;
}) {
  const [newRelicInitialized, setNewRelicInitialized] = useState(false);

  // TEMPORARY #12725
  useEffect(() => {
    installNrDebug12725();
    if (isNrDebug12725Enabled()) {
      nrDebug12725Log("SearchAnalytics newRelicEnabled prop", newRelicEnabled);
    }
  }, [newRelicEnabled]);

  useEffect(() => {
    if (!newRelicEnabled) {
      return;
    }
    waitForNewRelic()
      .then((ready) => {
        // TEMPORARY #12725: client-side NEW_RELIC_ENABLED may not be inlined into the bundle
        if (isNrDebug12725Enabled()) {
          nrDebug12725Log("waitForNewRelic resolved", {
            ready,
            clientNewRelicEnabled: environment.NEW_RELIC_ENABLED,
          });
        }
        return ready;
      })
      .then((ready) => setNewRelicInitialized(!!ready))
      .catch((e) => console.error("Error waiting for new relic", e));
  }, [newRelicEnabled]);

  // Use serialized attributes so equivalent param objects don't resend the event.
  const searchAttemptAttributes = JSON.stringify(
    getNewRelicSearchAttemptAttributes(params),
  );

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
