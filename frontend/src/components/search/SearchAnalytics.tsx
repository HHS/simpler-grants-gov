"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { omit } from "lodash";
import { SearchParamsTypes } from "src/types/search/searchRequestTypes";

import { useEffect } from "react";

const getCurrentFilters = (params: SearchParamsTypes): string => {
  return JSON.stringify(omit(params, "query", "page"));
};

function SearchAnalytics({ params }: { params: SearchParamsTypes }) {
  useEffect(() => {
    sendGAEvent("event", "search_attempt", {
      search_filters: getCurrentFilters(params),
    });
  }, [params]);
  return <></>;
}

export default SearchAnalytics;
