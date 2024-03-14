import "server-only";

import SearchOpportunityAPI, {
  SearchResponseData,
} from "../../app/api/SearchOpportunityAPI";

import { SearchFetcher } from "./SearchFetcher";

export class APISearchFetcher extends SearchFetcher {
  private searchApi: SearchOpportunityAPI;

  constructor() {
    super();
    this.searchApi = new SearchOpportunityAPI();
  }

  async fetchOpportunities(): Promise<SearchResponseData> {
    try {
      // Keep commented in case we need to simulate a delay to test loaders
      //  await new Promise((resolve) => setTimeout(resolve, 1250));

      const response = await this.searchApi.searchOpportunities();
      if (!response.data) {
        throw new Error(`No data returned from API`);
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  }
}
