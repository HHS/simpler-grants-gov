import { APISearchFetcher } from "./APISearchFetcher";
import { MockSearchFetcher } from "./MockSearchFetcher";
import { SearchFetcher } from "./SearchFetcher";

export const getSearchFetcher = (): SearchFetcher => {
  return process.env.USE_SEARCH_MOCK_DATA === "true"
    ? new MockSearchFetcher()
    : new APISearchFetcher();
};
