import "server-only";

import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";

export abstract class SearchFetcher {
  abstract fetchOpportunities(): Promise<SearchResponseData>;
}
