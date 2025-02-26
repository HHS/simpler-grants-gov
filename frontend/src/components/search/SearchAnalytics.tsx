"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { omit } from "lodash";
import { SearchParamsTypes } from "src/types/search/searchRequestTypes";
import { validSearchQueryParamKeys } from "src/types/search/searchResponseTypes";

import { useEffect } from "react";

const getCurrentFilters = (params: SearchParamsTypes): string => {
  return JSON.stringify(omit(params, "query", "page"));
};

// send custom New Relic and GA data for search pages
function SearchAnalytics({ params }: { params: SearchParamsTypes }) {
  // set new relic query param based custom attributes
  useEffect(() => {
    if (params) {
      console.log(
        "~~~ updating new relic search query param custom attributes",
        params,
      );
      Object.entries(params).forEach(([key, value]) => {
        if (key in validSearchQueryParamKeys) {
          console.log("$$$ setting new relic custom attribute", key, value);
        }
      });
    }
    return () => {
      console.log(
        "!!! unsetting new relic search query param custom attributes",
      );
    };
  }, [params]);

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
