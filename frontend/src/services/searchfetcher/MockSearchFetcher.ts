import { SearchFetcher } from "./SearchFetcher";
import { SearchResponseData } from "../../api/SearchOpportunityAPI";
import mockData from "../../api/mock/APIMockResponse.json";

export class MockSearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<SearchResponseData> {
    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 750));
    return mockData.data;
  }
}
