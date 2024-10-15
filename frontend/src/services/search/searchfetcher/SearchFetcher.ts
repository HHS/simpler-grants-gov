import "server-only";

import { SearchFetcherActionType } from "src/types/search/searchRequestTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

export interface QueryParamData {
  page: number;
  query: string | null | undefined;
  status: Set<string>;
  fundingInstrument: Set<string>;
  eligibility: Set<string>;
  agency: Set<string>;
  category: Set<string>;
  sortby: string | null;
  actionType?: SearchFetcherActionType;
  fieldChanged?: string;
}

export abstract class SearchFetcher {
  abstract fetchOpportunities(
    props: QueryParamData,
  ): Promise<SearchAPIResponse>;
}
