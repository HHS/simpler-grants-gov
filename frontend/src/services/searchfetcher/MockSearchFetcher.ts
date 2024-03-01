import { Opportunity } from "../../types/searchTypes";
import { SearchFetcher } from "./SearchFetcher";
import mockData from "../../api/mock/APIMockResponse.json";

export class MockSearchFetcher extends SearchFetcher {
  async fetchOpportunities(): Promise<Opportunity[]> {
    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 750));
    return mockData.data;
  }
}
