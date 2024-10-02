import { environment } from "src/constants/environments";

import { APISearchFetcher } from "./APISearchFetcher";
import { MockSearchFetcher } from "./MockSearchFetcher";
import { SearchFetcher } from "./SearchFetcher";

export const getSearchFetcher = (): SearchFetcher => {
  return environment.USE_SEARCH_MOCK_DATA === "true"
    ? new MockSearchFetcher()
    : new APISearchFetcher();
};
