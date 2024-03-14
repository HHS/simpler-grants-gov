import "server-only";

import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";

export interface SearchFetcherProps {
  page: number;
}

export abstract class SearchFetcher {
  abstract fetchOpportunities(
    props: SearchFetcherProps,
  ): Promise<SearchResponseData>;
}
