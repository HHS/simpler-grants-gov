import "server-only";

import { SearchFetcher } from "./SearchFetcher";
import { SearchResponseData } from "../../app/api/SearchOpportunityAPI";
import mockData from "../../app/api/mock/APIMockResponse.json";

export class MockSearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<SearchResponseData> {
    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 750));
    return mockData.data;
  }
}
