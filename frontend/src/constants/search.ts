import { FrontendFilterNames } from "src/types/search/searchFilterTypes";

// Show all values status for search.
export const SEARCH_NO_STATUS_VALUE = "none";
export const STATUS_FILTER_DEFAULT_VALUES = ["forecasted", "posted"];
export const defaultFilterValues: { [key in FrontendFilterNames]?: string[] } =
  {
    status: STATUS_FILTER_DEFAULT_VALUES,
  };
