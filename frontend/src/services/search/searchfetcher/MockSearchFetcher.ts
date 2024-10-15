import "server-only";

import mockData from "src/app/api/mock/APIMockResponse.json";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { SearchFetcher } from "./SearchFetcher";

export class MockSearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<SearchAPIResponse> {
    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 750));
    return mockData;
  }
}
