import "server-only";

import mockData from "src/app/api/mock/APIMockResponse.json";
import SearchOpportunityAPI from "src/app/api/SearchOpportunityAPI";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

export class MockSearchOpportunityAPI extends SearchOpportunityAPI {
  async searchOpportunities(): Promise<SearchAPIResponse> {
    return Promise.resolve(mockData);
  }
}
