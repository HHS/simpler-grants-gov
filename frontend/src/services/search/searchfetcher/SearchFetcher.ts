import "server-only";

import { SearchAPIResponse } from "../../../types/search/searchResponseTypes";

export interface SearchFetcherProps {
  page: number;
  query: string | null | undefined;
  status: Set<string>;
  agency: Set<string>;
  fundingInstrument: Set<string>;
  sortby: string | null;
}

export abstract class SearchFetcher {
  abstract fetchOpportunities(
    props: SearchFetcherProps,
  ): Promise<SearchAPIResponse>;
}
