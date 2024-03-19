import "server-only";

import { SearchAPIResponse } from "../../../types/searchTypes";
import { SearchFetcher } from "./SearchFetcher";
import mockData from "../../../app/api/mock/APIMockResponse.json";

export class MockSearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<SearchAPIResponse> {
    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 750));
    return mockData;
  }
}
