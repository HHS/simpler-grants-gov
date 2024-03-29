import "server-only";

import { SearchAPIResponse } from "../../../types/search/searchResponseTypes";
import { SearchFetcherActionType } from "../../../types/search/searchRequestTypes";

export interface SearchFetcherProps {
  page: number;
  query: string | null | undefined;
  status: Set<string>;
  agency: Set<string>;
  fundingInstrument: Set<string>;
  sortby: string | null;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}

export abstract class SearchFetcher {
  abstract fetchOpportunities(
    props: SearchFetcherProps,
  ): Promise<SearchAPIResponse>;
}
