import "server-only";

import { SearchAPIResponse } from "../../../types/searchTypes";

export interface SearchFetcherProps {
  page: number;
}

export abstract class SearchFetcher {
  abstract fetchOpportunities(
    props: SearchFetcherProps,
  ): Promise<SearchAPIResponse>;
}
